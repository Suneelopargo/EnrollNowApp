package com.enrollnow.administrator.dto;

public class AdminSiteOptionDto {

    private Long id;
    private String name;
    private String code;
    private String city;
    private String state;

    public AdminSiteOptionDto() {}

    public AdminSiteOptionDto(Long id, String name, String code, String city, String state) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.city = city;
        this.state = state;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}
