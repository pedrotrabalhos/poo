package br.edu.vehicleinventory.configuration;

public record StockSummary(long configurationId, long total, long available, long sold, long discontinued) {}
