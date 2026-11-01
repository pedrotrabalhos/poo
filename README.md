# Vehicle Inventory API

Backend do **Sistema Automotivo – Gestão de Estoque de Veículos**, com Java 25,
Spring Boot 4.1.2, Maven Wrapper, Spring MVC, JPA/Hibernate, PostgreSQL 18, Flyway,
Bean Validation e Actuator. O frontend React/Vite fica em `web/`, com execução e build independentes.

## Executar

```bash
./scripts/mvn spring-boot:run
```

O script seleciona `~/.local/share/jdks/temurin-25`. Na IDE, selecione esse caminho
como JDK do projeto e do Maven. Para outro JDK 25, defina `VEHICLE_JAVA_HOME`.
O Java 26 do sistema permanece disponível. Para usar o wrapper diretamente:

```bash
source scripts/java-env.sh
./mvnw spring-boot:run
```

O PostgreSQL existente deve estar rodando. Se necessário:

```bash
docker compose -f ~/Containers/compose.yml up -d postgres
```

A configuração local está em `.env.properties`, ignorada pelo Git e com permissão
0600. Em outra máquina, copie `.env.example.properties`, ajuste as credenciais e
provisione um usuário proprietário e os bancos `vehicle_inventory` e
`vehicle_inventory_test`. Variáveis de ambiente têm precedência sobre esse arquivo.

## Modelo de estoque

```text
Brand → CarModel → VehicleConfiguration → Vehicle (uma unidade física)
Tesla → Model 3  → BLACK / 200V / CAR   → TESLA-001, TESLA-002
                → WHITE / 200V / CAR   → TESLA-003
```

A configuração concentra atributos compartilhados. Cada unidade tem código de
estoque único, ano, preço, quilometragem e status próprios. A quantidade disponível
é calculada contando as unidades `AVAILABLE`; não há um contador duplicado.
`200V` é um exemplo de texto no campo `specification`, não uma validação técnica
sobre veículos Tesla.

## API REST

| Recurso | Rota |
| --- | --- |
| Marcas | `/api/brands` |
| Modelos | `/api/models` |
| Configurações | `/api/vehicle-configurations` |
| Unidades de estoque | `/api/vehicles` |

Os quatro recursos implementam `POST`, `GET`, `GET /{id}`, `PUT /{id}` e
`DELETE /{id}`. Unidades também implementam `PATCH /api/vehicles/{id}` para preço,
quilometragem e status. O resumo de estoque está em
`GET /api/vehicle-configurations/{id}/stock`.

Listas aceitam `page` (inicia em 0) e `size` (1–100, padrão 20), ordenadas por ID.
Unidades aceitam filtros combináveis por `brandId`, `modelId`, `configurationId`,
`minPrice`, `maxPrice`, `year`, `status`, `color`, `specification` e `vehicleType`.
Modelos aceitam `brandId`; configurações aceitam `modelId`.

```bash
curl http://localhost:8080/actuator/health
curl 'http://localhost:8080/api/vehicles?status=AVAILABLE&minPrice=50000&size=10'
```

A raiz `/` não tem página e retorna 404. A interface web está em
`http://localhost:5173`; a API usa o prefixo `/api` e o health check fica em
`/actuator/health`.

## Frontend Vite em `web/`

O frontend usa React, TypeScript e Bun, com a estrutura app-header, fontes e
ícones semânticos do Quadro. O tema neutro `b0` foi preservado e a interface está
em português brasileiro.
Pode ficar neste mesmo repositório: o Maven ignora a pasta `web/` por padrão.
Em um segundo terminal, com o backend rodando:

```bash
cd web
bun install --frozen-lockfile
bun run dev
```

Abra **http://localhost:5173**. A interface permite gerenciar marcas, modelos,
configurações e unidades, incluindo filtros, edição, status e exclusão.

O frontend conecta a `http://localhost:8080` por padrão. Para mudar isso, copie
`web/.env.example` para `web/.env.local` e ajuste `VITE_API_BASE_URL`.

O backend permite CORS para `http://localhost:5173` e `http://127.0.0.1:5173`.
Outras origens podem ser configuradas por `CORS_ALLOWED_ORIGINS` no backend.

```bash
bun run build
bun run test:e2e
```

Esses comandos são executados dentro de `web/`. O build gera `web/dist`, sem
alterar o JAR. Os testes de navegador iniciam um backend próprio em 18080 com o
banco de teste. Veja [web/README.md](web/README.md) para estrutura e detalhes.

## Banco e migrações

- `vehicle_inventory`: desenvolvimento.
- `vehicle_inventory_test`: testes de integração.
- V1: esquema original.
- V2: separa configurações das unidades, preservando registros existentes; unidades
  antigas recebem código `LEGACY-{id}` e especificação `STANDARD`.

Novas alterações devem usar novas migrações. O Hibernate usa `ddl-auto=validate`;
quem modifica o esquema é o Flyway.

## Testar e gerar JAR

```bash
./scripts/mvn verify
```

Os testes usam PostgreSQL real e limpam **somente o banco de teste**, protegido por
uma verificação do nome do banco. Cobrem CRUD, filtros, paginação, validação,
conflitos, CORS e migração de dados V1 → V2.

```bash
source scripts/java-env.sh
java -jar target/vehicle-inventory-0.0.1-SNAPSHOT.jar
```

## Organização do código

O backend está organizado por domínio em `src/main/java/br/edu/vehicleinventory/`:
`brand`, `model`, `configuration` e `vehicle`. Cada domínio possui controllers,
DTOs, serviços, entidades e repositórios. `shared` concentra a entidade base e o
tratamento de erros, enquanto `config` define o CORS.

A estrutura do frontend e as instruções de execução estão em
[web/README.md](web/README.md). O relatório acadêmico e o roteiro de gravação são
mantidos separadamente do repositório.
