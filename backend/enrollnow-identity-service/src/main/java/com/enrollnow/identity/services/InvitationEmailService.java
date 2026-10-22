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
                buildEmailBody(
                        "Hello " + recipientName + ", welcome to EnrollNow!",
                        "A new EnrollNow account has been created for you. Please click the button below to activate your account. This link will expire in 14 days.",
                        "Activate Account",
                        activationUrl,
                        null
                );

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
                buildEmailBody(
                        "Hello " + recipientName + ",",
                        "You requested to reset your password. Please follow the link below to reset your password.",
                        "Reset Password",
                        resetUrl,
                        "If you did not request this change, please contact your Site Administrator."
                );

        sendEmail(recipientEmail, subject, body, accessToken);
    }

    private String buildEmailBody(
            String greeting,
            String introText,
            String buttonText,
            String actionUrl,
            String footerNote) {

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>");
        sb.append("<body style=\"margin: 0; padding: 24px 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;\">");
        sb.append("<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"max-width: 600px; margin: 0 auto; padding: 0 20px;\">");

        // Centered EnrollNow Logo
        sb.append("<tr><td align=\"center\" style=\"padding: 10px 0 28px 0;\">");
        sb.append("<img src=\"cid:").append(EnrollNowEmailAssets.LOGO_CONTENT_ID).append("\" alt=\"EnrollNow\" width=\"300\" style=\"display: inline-block; width: 300px; max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none;\" />");
        sb.append("</td></tr>");

        // Greeting
        sb.append("<tr><td style=\"font-size: 15px; color: #1e293b; padding-bottom: 16px;\">");
        sb.append(greeting);
        sb.append("</td></tr>");

        // Intro message
        sb.append("<tr><td style=\"font-size: 15px; color: #1e293b; padding-bottom: 24px;\">");
        sb.append(introText);
        sb.append("</td></tr>");

        // Action Button
        sb.append("<tr><td align=\"center\" style=\"padding-bottom: 24px;\">");
        sb.append("<table cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tr><td align=\"center\" style=\"border-radius: 4px; background-color: #004b87;\">");
        sb.append("<a href=\"").append(actionUrl).append("\" target=\"_blank\" style=\"font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 4px; padding: 12px 32px; border: 1px solid #004b87; display: inline-block; font-weight: 600;\">");
        sb.append(buttonText);
        sb.append("</a></td></tr></table>");
        sb.append("</td></tr>");


        // Optional footer note
        if (footerNote != null && !footerNote.trim().isEmpty()) {
            sb.append("<tr><td style=\"font-size: 13px; color: #64748b; padding-bottom: 20px;\">");
            sb.append(footerNote);
            sb.append("</td></tr>");
        }

        // Sign-off
        sb.append("<tr><td style=\"font-size: 15px; color: #1e293b; border-top: 1px solid #e2e8f0; padding-top: 20px;\">");
        sb.append("Thank you,<br><strong>EnrollNow</strong>");
        sb.append("</td></tr>");

        sb.append("</table></body></html>");
        return sb.toString();
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

        Map<String, Object> logoAttachment =
                new HashMap<>();
        logoAttachment.put("@odata.type", "#microsoft.graph.fileAttachment");
        logoAttachment.put("name", EnrollNowEmailAssets.LOGO_FILENAME);
        logoAttachment.put("contentType", EnrollNowEmailAssets.LOGO_CONTENT_TYPE);
        logoAttachment.put("contentBytes", EnrollNowEmailAssets.getLogoBase64());
        logoAttachment.put("contentId", EnrollNowEmailAssets.LOGO_CONTENT_ID);
        logoAttachment.put("isInline", true);

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

        message.put(
                "attachments",
                List.of(logoAttachment)
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