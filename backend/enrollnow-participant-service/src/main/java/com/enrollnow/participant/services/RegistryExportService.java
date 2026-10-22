package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.RegistryParticipantDto;
import com.enrollnow.participant.dtos.StudyItemDto;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RegistryExportService {

    public byte[] exportToCsv(List<RegistryParticipantDto> participants) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            // Header
            writer.println("Participant ID,Name,First Name,Last Name,Age,Gender,Status,Phone,City,State,Zip Code,Studies,Contact For Future Studies,Date Created");

            for (RegistryParticipantDto p : participants) {
                String studies = p.getStudies() != null
                        ? p.getStudies().stream().map(StudyItemDto::getName).collect(Collectors.joining("; "))
                        : "";

                writer.println(String.join(",",
                        escapeCsv(p.getId()),
                        escapeCsv(p.getName()),
                        escapeCsv(p.getFirstName()),
                        escapeCsv(p.getLastName()),
                        escapeCsv(p.getAge()),
                        escapeCsv(p.getGender()),
                        escapeCsv(p.getStatus()),
                        escapeCsv(p.getPhone()),
                        escapeCsv(p.getCity()),
                        escapeCsv(p.getState()),
                        escapeCsv(p.getZipcode()),
                        escapeCsv(studies),
                        escapeCsv(p.getContactForFutureStudies() != null ? (p.getContactForFutureStudies() ? "Yes" : "No") : ""),
                        escapeCsv(p.getDateCreated())
                ));
            }
        }
        return out.toByteArray();
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "\"\"";
        }
        String sanitized = value;
        // Prevent CSV Formula Injection (CWE-1236) if cell value begins with dangerous characters
        if (sanitized.startsWith("=") || sanitized.startsWith("+") || sanitized.startsWith("-") || sanitized.startsWith("@") || sanitized.startsWith("\t")) {
            sanitized = "'" + sanitized;
        }
        String escaped = sanitized.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
