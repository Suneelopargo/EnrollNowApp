package com.enrollnow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;

@Configuration
public class SecurityConfig {
	
	private final SessionValidationFilter sessionValidationFilter;

	public SecurityConfig(
	        SessionValidationFilter sessionValidationFilter) {

	    this.sessionValidationFilter =
	            sessionValidationFilter;
	}

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth

                /*
                 * Public authentication endpoints
                 */
                .requestMatchers(
                    "/api/v1/tenants/*/auth/login",
                    "/api/v1/tenants/*/auth/forgot-password",
                    "/api/v1/tenants/*/auth/reset-password"
                ).permitAll()

                /*
                 * Swagger / OpenAPI for development
                 */
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).permitAll()

                /*
                 * Everything else requires a valid JWT
                 */
                .anyRequest().authenticated()
            )

            .oauth2ResourceServer(
            	    oauth2 -> oauth2.jwt(jwt -> {})
            	)

            	.addFilterAfter(
            	    sessionValidationFilter,
            	    BearerTokenAuthenticationFilter.class
            	)

            	.formLogin(form -> form.disable())
            	.httpBasic(basic -> basic.disable());

        return http.build();
    }
}