package com.enrollnow.participant.dtos;

import java.util.UUID;

public class ContactTeamMemberDto {

    private UUID id;
    private String name;
    private String email;

    public ContactTeamMemberDto() {
    }

    public ContactTeamMemberDto(UUID id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
