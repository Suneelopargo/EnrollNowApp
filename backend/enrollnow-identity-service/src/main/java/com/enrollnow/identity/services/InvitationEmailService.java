package com.enrollnow.identity.services;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InvitationEmailService {

    private final String tenantId;
    private final String clientId;
    private final String clientSecret;
    private final String mailbox;
    private final String activationBaseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public InvitationEmailService(
            @Value("${app.graph.tenant-id}") String tenantId,
            @Value("${app.graph.client-id}") String clientId,
            @Value("${app.graph.client-secret}") String clientSecret,
            @Value("${app.graph.mailbox}") String mailbox,
            @Value("${app.frontend.activation-url}") String activationBaseUrl) {

        this.tenantId = tenantId;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.mailbox = mailbox;
        this.activationBaseUrl = activationBaseUrl;

        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public void sendInvitation(
            String recipientEmail,
            String recipientName,
            String tenantIdValue,
            String rawToken) {

        String accessToken = getGraphAccessToken();

        String activationUrl =
                UriComponentsBuilder
                        .fromUriString(activationBaseUrl)
                        .queryParam("tenantId", tenantIdValue)
                        .queryParam("token", rawToken)
                        .build()
                        .toUriString();

        String subject =
                "Welcome to EnrollNow - Set up your account";

        String body =
                "Hello " + recipientName + ",<br><br>"
                + "You have been invited to EnrollNow.<br><br>"
                + "Please use the link below to set up your password:<br><br>"
                + "<a href=\"" + activationUrl + "\">Set Your Password</a><br><br>"
                + "This invitation link expires in 14 days.<br><br>"
                + "If you were not expecting this invitation, "
                + "please contact your EnrollNow administrator.<br><br>"
                + "EnrollNow";

        Map<String, Object> emailAddress =
                Map.of(
                        "address",
                        recipientEmail
                );

        Map<String, Object> recipient =
                Map.of(
                        "emailAddress",
                        emailAddress
                );

        Map<String, Object> message =
                new HashMap<>();

        message.put("subject", subject);

        message.put(
                "body",
                Map.of(
                        "contentType", "HTML",
                        "content", body
                )
        );

        message.put(
                "toRecipients",
                List.of(recipient)
        );

        Map<String, Object> requestBody =
                Map.of(
                        "message", message,
                        "saveToSentItems", true
                );

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBearerAuth(accessToken);
        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(
                        requestBody,
                        headers
                );

        String sendMailUrl =
                "https://graph.microsoft.com/v1.0/users/"
                        + mailbox
                        + "/sendMail";

        ResponseEntity<Void> response =
                restTemplate.exchange(
                        sendMailUrl,
                        HttpMethod.POST,
                        entity,
                        Void.class
                );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new IllegalStateException(
                    "Failed to send invitation email"
            );
        }
    }

    private String getGraphAccessToken() {

        String tokenUrl =
                "https://login.microsoftonline.com/"
                        + tenantId
                        + "/oauth2/v2.0/token";

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_FORM_URLENCODED
        );

        String body =
                UriComponentsBuilder
                        .newInstance()
                        .queryParam(
                                "client_id",
                                clientId
                        )
                        .queryParam(
                                "client_secret",
                                clientSecret
                        )
                        .queryParam(
                                "scope",
                                "https://graph.microsoft.com/.default"
                        )
                        .queryParam(
                                "grant_type",
                                "client_credentials"
                        )
                        .build()
                        .encode()
                        .toUriString()
                        .substring(1);

        HttpEntity<String> entity =
                new HttpEntity<>(
                        body,
                        headers
                );

        ResponseEntity<Map> response =
                restTemplate.exchange(
                        tokenUrl,
                        HttpMethod.POST,
                        entity,
                        Map.class
                );

        Map responseBody =
                response.getBody();

        if (responseBody == null
                || responseBody.get("access_token") == null) {

            throw new IllegalStateException(
                    "Unable to obtain Microsoft Graph access token"
            );
        }

        return responseBody
                .get("access_token")
                .toString();
    }
}