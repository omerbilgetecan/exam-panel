package com.example.backend.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;

@Component
public class DatabaseSeedInitializer implements ApplicationRunner {
    private static final List<Path> SEED_FILE_CANDIDATES = List.of(
            Path.of("database_seed_evaluation_data.sql"),
            Path.of("..", "database_seed_evaluation_data.sql")
    );

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSeedInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!shouldSeed()) {
            return;
        }

        Path seedFile = findSeedFile();
        String script = Files.readString(seedFile, StandardCharsets.UTF_8);
        Arrays.stream(script.split(";\\s*(?:\\r?\\n|$)"))
                .map(String::trim)
                .filter(statement -> !statement.isBlank())
                .forEach(jdbcTemplate::execute);
    }

    private boolean shouldSeed() {
        return countRows("dbo.Bolumler") == 0
                || countRows("dbo.Dersler") == 0
                || countRows("dbo.Derslikler") == 0
                || countRows("dbo.Oturumlar") == 0
                || countRows("dbo.Personel") == 0;
    }

    private int countRows(String tableName) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Integer.class);
        return count == null ? 0 : count;
    }

    private Path findSeedFile() throws IOException {
        for (Path candidate : SEED_FILE_CANDIDATES) {
            Path absolute = candidate.toAbsolutePath().normalize();
            if (Files.isRegularFile(absolute)) {
                return absolute;
            }
        }

        throw new IOException("database_seed_evaluation_data.sql dosyasi bulunamadi.");
    }
}
