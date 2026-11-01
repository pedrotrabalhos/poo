package br.edu.vehicleinventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.UUID;
import javax.sql.DataSource;
import com.jayway.jsonpath.JsonPath;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VehicleInventoryApplicationTests {
    private static final String BRANDS = "/api/brands";
    private static final String MODELS = "/api/models";
    private static final String CONFIGURATIONS = "/api/vehicle-configurations";
    private static final String VEHICLES = "/api/vehicles";

    @Autowired private MockMvc mvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private Flyway flyway;
    @Autowired private DataSource dataSource;

    @BeforeEach
    void clearDedicatedTestDatabase() {
        // Guard destructive test cleanup: never run it against the development database.
        assertThat(jdbc.queryForObject("SELECT current_database()", String.class))
                .isEqualTo("vehicle_inventory_test");
        jdbc.execute("TRUNCATE vehicles, vehicle_configurations, models, brands RESTART IDENTITY");
    }

    @Test
    void startsWithPostgresAndAppliesInventoryMigrations() {
        assertThat(flyway.info().pending()).isEmpty();
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("2");
        assertThat(jdbc.queryForList("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('brands', 'models', 'vehicle_configurations', 'vehicles')
                """, String.class)).containsExactlyInAnyOrder("brands", "models", "vehicle_configurations", "vehicles");
    }

    @Test
    void storesConfigurationsSeparatelyFromIndividualStockUnits() throws Exception {
        Catalog catalog = catalog();
        long white = configuration(catalog.model(), "WHITE", "200V");
        vehicle(catalog.configuration(), "TESLA-001", 2025, "100000.00", 0, "AVAILABLE");
        vehicle(catalog.configuration(), "TESLA-002", 2024, "90000.00", 20000, "AVAILABLE");
        vehicle(white, "TESLA-003", 2025, "110000.00", 0, "AVAILABLE");

        mvc.perform(get(VEHICLES).param("configurationId", "" + catalog.configuration()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].configuration.model.brand.name").value("Tesla"))
                .andExpect(jsonPath("$.content[0].configuration.specification").value("200V"));
        mvc.perform(get(CONFIGURATIONS + "/" + catalog.configuration() + "/stock"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.available").value(2)).andExpect(jsonPath("$.sold").value(0));
        mvc.perform(get(CONFIGURATIONS + "/" + white + "/stock"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.available").value(1));
        long empty = configuration(catalog.model(), "BLUE", "200V");
        mvc.perform(get(CONFIGURATIONS + "/" + empty + "/stock"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void combinesAllAssignmentFiltersAndPaginatesUnits() throws Exception {
        Catalog catalog = catalog();
        long white = configuration(catalog.model(), "WHITE", "200V");
        vehicle(catalog.configuration(), "BLACK-1", 2025, "100000.00", 0, "AVAILABLE");
        vehicle(catalog.configuration(), "BLACK-2", 2025, "120000.00", 10, "SOLD");
        vehicle(white, "WHITE-1", 2024, "90000.00", 10000, "AVAILABLE");
        long toyota = create(BRANDS, "{\"name\":\"Toyota\"}");
        long corolla = create(MODELS, "{\"brandId\":" + toyota + ",\"name\":\"Corolla\"}");
        long other = configuration(corolla, "BLACK", "HYBRID");
        vehicle(other, "TOYOTA-1", 2025, "100000.00", 0, "AVAILABLE");

        mvc.perform(get(VEHICLES).param("brandId", "" + catalog.brand()).param("modelId", "" + catalog.model())
                .param("configurationId", "" + catalog.configuration()).param("minPrice", "95000")
                .param("maxPrice", "110000").param("year", "2025").param("status", "AVAILABLE")
                .param("color", "black").param("specification", "200v").param("vehicleType", "car")
                .param("page", "0").param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].stockCode").value("BLACK-1"));
        mvc.perform(get(VEHICLES).param("page", "1").param("size", "2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(4)).andExpect(jsonPath("$.totalPages").value(2));
        mvc.perform(get(VEHICLES).param("minPrice", "150000"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    void updatesReassignsPatchesAndRemovesOneUnitWithoutChangingAnother() throws Exception {
        Catalog catalog = catalog();
        long white = configuration(catalog.model(), "WHITE", "200V");
        long first = vehicle(catalog.configuration(), "FIRST", 2024, "90000.00", 100, "AVAILABLE");
        long second = vehicle(catalog.configuration(), "SECOND", 2025, "100000.00", 0, "AVAILABLE");

        mvc.perform(put(VEHICLES + "/" + first).contentType(MediaType.APPLICATION_JSON)
                .content(vehicleBody(white, "updated", 2025, "95000.00", 200, "AVAILABLE")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.stockCode").value("UPDATED"))
                .andExpect(jsonPath("$.configuration.id").value(white));
        mvc.perform(patch(VEHICLES + "/" + first).contentType(MediaType.APPLICATION_JSON)
                .content("{\"price\":94000.00,\"mileage\":250,\"status\":\"SOLD\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.price").value(94000))
                .andExpect(jsonPath("$.mileage").value(250)).andExpect(jsonPath("$.stockCode").value("UPDATED"));
        mvc.perform(get(CONFIGURATIONS + "/" + white + "/stock"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.sold").value(1))
                .andExpect(jsonPath("$.available").value(0));
        mvc.perform(delete(VEHICLES + "/" + first)).andExpect(status().isNoContent());
        mvc.perform(get(VEHICLES + "/" + first)).andExpect(status().isNotFound());
        mvc.perform(get(VEHICLES + "/" + second)).andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(100000)).andExpect(jsonPath("$.status").value("AVAILABLE"));
        mvc.perform(get(CONFIGURATIONS + "/" + white + "/stock"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void supportsCrudForBrandsModelsAndConfigurations() throws Exception {
        Catalog catalog = catalog();
        mvc.perform(put(BRANDS + "/" + catalog.brand()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Tesla Motors\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Tesla Motors"));
        mvc.perform(put(MODELS + "/" + catalog.model()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"brandId\":" + catalog.brand() + ",\"name\":\"Model Y\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Model Y"));
        mvc.perform(put(CONFIGURATIONS + "/" + catalog.configuration()).contentType(MediaType.APPLICATION_JSON)
                .content(configurationBody(catalog.model(), "WHITE", "400V")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.color").value("WHITE"));
        mvc.perform(get(BRANDS)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get(MODELS).param("brandId", "" + catalog.brand()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].brand.name").value("Tesla Motors"));
        mvc.perform(get(CONFIGURATIONS).param("modelId", "" + catalog.model()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].specification").value("400V"));
        mvc.perform(get(CONFIGURATIONS + "/" + catalog.configuration())).andExpect(status().isOk());
        mvc.perform(delete(CONFIGURATIONS + "/" + catalog.configuration())).andExpect(status().isNoContent());
        mvc.perform(delete(MODELS + "/" + catalog.model())).andExpect(status().isNoContent());
        mvc.perform(delete(BRANDS + "/" + catalog.brand())).andExpect(status().isNoContent());
    }

    @Test
    void editingSharedConfigurationChangesDescriptionsButPreservesUnitValues() throws Exception {
        Catalog catalog = catalog();
        long first = vehicle(catalog.configuration(), "FIRST", 2024, "90000.00", 100, "AVAILABLE");
        long second = vehicle(catalog.configuration(), "SECOND", 2025, "100000.00", 0, "AVAILABLE");
        mvc.perform(put(CONFIGURATIONS + "/" + catalog.configuration()).contentType(MediaType.APPLICATION_JSON)
                .content(configurationBody(catalog.model(), "WHITE", "400V"))).andExpect(status().isOk());
        for (long id : new long[] { first, second }) {
            mvc.perform(get(VEHICLES + "/" + id)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.configuration.color").value("WHITE"))
                    .andExpect(jsonPath("$.configuration.specification").value("400V"));
        }
        mvc.perform(get(VEHICLES + "/" + first)).andExpect(jsonPath("$.price").value(90000))
                .andExpect(jsonPath("$.mileage").value(100));
        mvc.perform(get(VEHICLES + "/" + second)).andExpect(jsonPath("$.price").value(100000))
                .andExpect(jsonPath("$.mileage").value(0));
    }

    @Test
    void rejectsCaseInsensitiveDuplicatesButAllowsSeveralUnitsPerConfiguration() throws Exception {
        Catalog catalog = catalog();
        expectConflict(BRANDS, "{\"name\":\" tesla \"}");
        expectConflict(MODELS, "{\"brandId\":" + catalog.brand() + ",\"name\":\"model 3\"}");
        expectConflict(CONFIGURATIONS, configurationBody(catalog.model(), " black ", "200v"));
        vehicle(catalog.configuration(), "UNIQUE-001", 2025, "100.00", 0, "AVAILABLE");
        expectConflict(VEHICLES, vehicleBody(catalog.configuration(), " unique-001 ", 2025, "200.00", 0, "AVAILABLE"));
        vehicle(catalog.configuration(), "UNIQUE-002", 2025, "200.00", 0, "AVAILABLE");
    }

    @Test
    void protectsReferencedCatalogRowsAndRequiresSoldOrDiscontinuedBeforeRemoval() throws Exception {
        Catalog catalog = catalog();
        long unit = vehicle(catalog.configuration(), "UNIT", 2025, "100.00", 0, "AVAILABLE");
        for (String path : new String[] { BRANDS + "/" + catalog.brand(), MODELS + "/" + catalog.model(),
                CONFIGURATIONS + "/" + catalog.configuration(), VEHICLES + "/" + unit }) {
            mvc.perform(delete(path)).andExpect(status().isConflict());
        }
        mvc.perform(patch(VEHICLES + "/" + unit).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"DISCONTINUED\"}")).andExpect(status().isOk());
        mvc.perform(delete(VEHICLES + "/" + unit)).andExpect(status().isNoContent());
    }

    @Test
    void rejectsInvalidBodiesAndUnknownReferences() throws Exception {
        Catalog catalog = catalog();
        String valid = vehicleBody(catalog.configuration(), "VALID", 2025, "100.00", 0, "AVAILABLE");
        for (String invalid : new String[] {
                valid.replace("100.00", "-1"), valid.replace("100.00", "1.001"),
                valid.replace("\"mileage\":0", "\"mileage\":-1"),
                valid.replace("2025", "1800"), valid.replace("VALID", " "),
                valid.replace("AVAILABLE", "UNKNOWN"), valid.replace("100.00", "null"),
                valid.replace("\"stockCode\"", "\"unexpectedField\"") }) {
            mvc.perform(post(VEHICLES).contentType(MediaType.APPLICATION_JSON).content(invalid))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(post(VEHICLES).contentType(MediaType.APPLICATION_JSON)
                .content(vehicleBody(999999, "MISSING", 2025, "100.00", 0, "AVAILABLE")))
                .andExpect(status().isNotFound());
        mvc.perform(post(MODELS).contentType(MediaType.APPLICATION_JSON)
                .content("{\"brandId\":999999,\"name\":\"Missing\"}")).andExpect(status().isNotFound());
        mvc.perform(post(CONFIGURATIONS).contentType(MediaType.APPLICATION_JSON)
                .content(configurationBody(999999, "BLACK", "200V"))).andExpect(status().isNotFound());
        mvc.perform(post(BRANDS).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\" \"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("name"));
    }

    @Test
    void rejectsInvalidFiltersPaginationAndPatches() throws Exception {
        for (String query : new String[] { "minPrice=200&maxPrice=100", "year=abc", "status=UNKNOWN",
                "page=-1", "size=0", "size=101", "brandId=-1", "minPrice=-1", "year=1800" }) {
            mvc.perform(get(VEHICLES + "?" + query)).andExpect(status().isBadRequest());
        }
        Catalog catalog = catalog();
        long unit = vehicle(catalog.configuration(), "UNIT", 2025, "100.00", 0, "AVAILABLE");
        for (String body : new String[] { "{}", "{\"price\":null}", "{\"price\":-1}",
                "{\"mileage\":-1}", "{\"price\":1.001}", "{\"status\":\"UNKNOWN\"}", "{\"color\":\"WHITE\"}" }) {
            mvc.perform(patch(VEHICLES + "/" + unit).contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void returnsProblemDetailsForMissingResources() throws Exception {
        for (String route : new String[] { BRANDS, MODELS, CONFIGURATIONS, VEHICLES }) {
            mvc.perform(get(route + "/999999")).andExpect(status().isNotFound())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                    .andExpect(jsonPath("$.status").value(404)).andExpect(jsonPath("$.detail").isNotEmpty());
        }
        mvc.perform(get(CONFIGURATIONS + "/999999/stock")).andExpect(status().isNotFound());
    }

    @Test
    void allowsConfiguredViteOriginsAndRejectsOtherOrigins() throws Exception {
        mvc.perform(options(VEHICLES).header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mvc.perform(options(VEHICLES).header("Origin", "https://unconfigured.example")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        mvc.perform(post(BRANDS).header("Origin", "http://localhost:5173")
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Tesla\"}"))
                .andExpect(status().isCreated()).andExpect(header().exists("Location"))
                .andExpect(header().string("Access-Control-Expose-Headers", "Location"));
    }

    @Test
    void upgradesLegacyUnitsWithoutLosingTheirIndividualData() {
        String schema = "migration_test_" + UUID.randomUUID().toString().replace("-", "");
        try {
            Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).target("1").load().migrate();
            long brand = jdbc.queryForObject("INSERT INTO " + schema + ".brands (name) VALUES ('Legacy') RETURNING id", Long.class);
            long model = jdbc.queryForObject("INSERT INTO " + schema + ".models (brand_id, name) VALUES (?, 'Legacy model') RETURNING id", Long.class, brand);
            for (String color : new String[] { "BLACK", "black" }) {
                jdbc.update("INSERT INTO " + schema + ".vehicles (model_id, manufacture_year, color, price, mileage, vehicle_type, status) VALUES (?, 2024, ?, 100.00, 123, 'CAR', 'AVAILABLE')", model, color);
            }
            Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).load().migrate();
            assertThat(jdbc.queryForObject("SELECT count(*) FROM " + schema + ".vehicle_configurations", Integer.class)).isEqualTo(1);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM " + schema + ".vehicles WHERE stock_code LIKE 'LEGACY-%' AND mileage = 123 AND price = 100 AND configuration_id IS NOT NULL", Integer.class)).isEqualTo(2);
        } finally {
            jdbc.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
        }
    }

    private Catalog catalog() throws Exception {
        long brand = create(BRANDS, "{\"name\":\"Tesla\"}");
        long model = create(MODELS, "{\"brandId\":" + brand + ",\"name\":\"Model 3\"}");
        return new Catalog(brand, model, configuration(model, "BLACK", "200V"));
    }

    private long configuration(long model, String color, String specification) throws Exception {
        return create(CONFIGURATIONS, configurationBody(model, color, specification));
    }

    private String configurationBody(long model, String color, String specification) {
        return """
                {"modelId":%d,"color":"%s","specification":"%s","vehicleType":"CAR"}
                """.formatted(model, color, specification);
    }

    private long vehicle(long configuration, String stockCode, int year, String price, long mileage, String status) throws Exception {
        return create(VEHICLES, vehicleBody(configuration, stockCode, year, price, mileage, status));
    }

    private String vehicleBody(long configuration, String stockCode, int year, String price, long mileage, String status) {
        return """
                {"configurationId":%d,"stockCode":"%s","manufactureYear":%d,"price":%s,"mileage":%d,"status":"%s"}
                """.formatted(configuration, stockCode, year, price, mileage, status);
    }

    private long create(String path, String body) throws Exception {
        String response = mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andExpect(header().exists("Location"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.<Number>read(response, "$.id").longValue();
    }

    private void expectConflict(String path, String body) throws Exception {
        mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isConflict());
    }

    private record Catalog(long brand, long model, long configuration) {}
}
