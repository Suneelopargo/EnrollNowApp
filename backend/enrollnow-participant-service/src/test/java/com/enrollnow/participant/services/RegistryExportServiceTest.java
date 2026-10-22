package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.RegistryParticipantDto;
import com.enrollnow.participant.dtos.StudyItemDto;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RegistryExportServiceTest {

    private final RegistryExportService service = new RegistryExportService();

    @Test
    void exportToCsv_generatesValidCsvHeaderAndRows() {
        RegistryParticipantDto p = new RegistryParticipantDto();
        p.setId("p-1");
        p.setName("Alice Walker");
        p.setFirstName("Alice");
        p.setLastName("Walker");
        p.setAge("35");
        p.setGender("Female");
        p.setStatus("Active");
        p.setPhone("+1 (555) 123-4567");
        p.setCity("Philadelphia");
        p.setState("PA");
        p.setZipcode("19104");
        p.setStudies(List.of(new StudyItemDto("Autism Study", true)));
        p.setContactForFutureStudies(true);
        p.setDateCreated("2026-10-22");

        byte[] bytes = service.exportToCsv(List.of(p));
        String csv = new String(bytes, StandardCharsets.UTF_8);

        assertThat(csv).contains("Participant ID,Name,First Name,Last Name,Age,Gender,Status,Phone,City,State,Zip Code,Studies,Contact For Future Studies,Date Created");
        assertThat(csv).contains("\"p-1\",\"Alice Walker\",\"Alice\",\"Walker\",\"35\",\"Female\",\"Active\"");
        assertThat(csv).contains("\"Autism Study\"");
    }

    @Test
    void exportToCsv_sanitizesFormulaInjectionCharacters() {
        RegistryParticipantDto p = new RegistryParticipantDto();
        p.setId("p-inj");
        p.setName("=cmd|'/C calc'!A0");
        p.setFirstName("+malicious");
        p.setLastName("-eval");
        p.setCity("@danger");

        byte[] bytes = service.exportToCsv(List.of(p));
        String csv = new String(bytes, StandardCharsets.UTF_8);

        // Dangerous characters are prefixed with single quote
        assertThat(csv).contains("\"'=cmd|'/C calc'!A0\"");
        assertThat(csv).contains("\"'+malicious\"");
        assertThat(csv).contains("\"'-eval\"");
        assertThat(csv).contains("\"'@danger\"");
    }
}
