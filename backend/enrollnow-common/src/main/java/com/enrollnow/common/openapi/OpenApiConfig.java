package com.enrollnow.common.openapi;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    public static final String BEARER_AUTH = "BearerAuth";

    @Bean
    public OpenAPI customOpenAPI(
            @Value("${spring.application.name:enrollnow-service}") String applicationName,
            @Value("${app.openapi.title:EnrollNow Microservice API}") String title,
            @Value("${app.openapi.description:Authoritative API Specification for EnrollNow Platform}") String description,
            @Value("${app.openapi.version:1.0.0}") String version) {

        return new OpenAPI()
                .info(new Info()
                        .title(title)
                        .description(description)
                        .version(version)
                        .contact(new Contact()
                                .name("EnrollNow Engineering")
                                .email("engineering@enrollnow.local"))
                        .license(new License()
                                .name("EnrollNow Enterprise License")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .name(BEARER_AUTH)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT Bearer token authorization. Enter your token generated from /api/v1/auth/login.")));
    }
}
