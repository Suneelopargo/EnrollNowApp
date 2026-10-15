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
    private final String passwordResetBaseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public InvitationEmailService(
            @Value("${app.graph.tenant-id}") String tenantId,
            @Value("${app.graph.client-id}") String clientId,
            @Value("${app.graph.client-secret}") String clientSecret,
            @Value("${app.graph.mailbox}") String mailbox,
            @Value("${app.frontend.activation-url}") String activationBaseUrl,
            @Value("${app.frontend.password-reset-url:http://localhost:3000/reset-password}") String passwordResetBaseUrl) {

        this.tenantId = tenantId;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.mailbox = mailbox;
        this.activationBaseUrl = activationBaseUrl;
        this.passwordResetBaseUrl = passwordResetBaseUrl;

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
                "Welcome to EnrollNow - Activate your account";

        String body =
                "Hello " + recipientName + ", welcome to EnrollNow!<br><br>"
                + "A new EnrollNow account has been created for you. Please click the button below to activate your account. This link will expire in 14 days.<br><br>"
                + "<table cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin: 20px 0;\">"
                + "<tr>"
                + "<td align=\"center\" style=\"border-radius: 4px; background-color: #004b87;\">"
                + "<a href=\"" + activationUrl + "\" target=\"_blank\" style=\"font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 4px; padding: 12px 28px; border: 1px solid #004b87; display: inline-block; font-weight: 600;\">"
                + "Activate Account"
                + "</a>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "Thank you,<br>"
                + "EnrollNow";

        sendEmail(recipientEmail, subject, body, accessToken);
    }

    public void sendPasswordReset(
            String recipientEmail,
            String recipientName,
            String tenantIdValue,
            String rawToken) {

        String accessToken = getGraphAccessToken();

        String resetUrl =
                UriComponentsBuilder
                        .fromUriString(passwordResetBaseUrl)
                        .queryParam("tenantId", tenantIdValue)
                        .queryParam("token", rawToken)
                        .build()
                        .toUriString();

        String subject = "EnrollNow - Reset Your Password";

        String body =
                "Hello " + recipientName + ",<br><br>"
                + "We received a request to reset your password for your EnrollNow account.<br><br>"
                + "Please click the button below to reset your password. This link will expire in 30 minutes.<br><br>"
                + "<table cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin: 20px 0;\">"
                + "<tr>"
                + "<td align=\"center\" style=\"border-radius: 4px; background-color: #004b87;\">"
                + "<a href=\"" + resetUrl + "\" target=\"_blank\" style=\"font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 4px; padding: 12px 28px; border: 1px solid #004b87; display: inline-block; font-weight: 600;\">"
                + "Reset Password"
                + "</a>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "If you did not request a password reset, please ignore this email or contact support.<br><br>"
                + "Thank you,<br>"
                + "EnrollNow";

        sendEmail(recipientEmail, subject, body, accessToken);
    }

    private void sendEmail(
            String recipientEmail,
            String subject,
            String body,
            String accessToken) {

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
                    "Failed to send email via Microsoft Graph"
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