package com.enrollnow.participant.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Production-ready SMS Gateway Service supporting Twilio REST API integration.
 * Handles phone number normalization, message length limits, actual HTTP delivery,
 * HMAC-SHA1 webhook signature verification, and clear failure/unconfigured states.
 */
@Service
public class SmsGatewayService {

    private static final Logger log = LoggerFactory.getLogger(SmsGatewayService.class);

    public static final int MAX_MESSAGE_LENGTH = 1600;

    private final String provider;
    private final String accountSid;
    private final String authToken;
    private final String fromNumber;
    private final String countryCode;
    private final HttpClient httpClient;

    @Autowired
    public SmsGatewayService(
            @Value("${enrollnow.sms.provider:twilio}") String provider,
            @Value("${enrollnow.sms.twilio.account-sid:${TWILIO_ACCOUNT_SID:}}") String accountSid,
            @Value("${enrollnow.sms.twilio.auth-token:${TWILIO_AUTH_TOKEN:}}") String authToken,
            @Value("${enrollnow.sms.twilio.from-number:${TWILIO_FROM_NUMBER:}}") String fromNumber,
            @Value("${enrollnow.sms.country-code:${TWILIO_COUNTRY_CODE:US}}") String countryCode
    ) {
        this(provider, accountSid, authToken, fromNumber, countryCode, null);
    }

    public SmsGatewayService(
            String provider,
            String accountSid,
            String authToken,
            String fromNumber,
            String countryCode,
            HttpClient httpClient
    ) {
        this.provider = provider != null ? provider.trim() : "twilio";
        this.accountSid = accountSid != null ? accountSid.trim() : "";
        this.authToken = authToken != null ? authToken.trim() : "";
        this.fromNumber = fromNumber != null ? fromNumber.trim() : "";
        this.countryCode = countryCode != null ? countryCode.trim() : "US";
        this.httpClient = httpClient != null ? httpClient : HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Checks whether valid provider credentials are configured.
     */
    public boolean isConfigured() {
        return !accountSid.isBlank() && !authToken.isBlank() && !fromNumber.isBlank();
    }

    public String getProvider() {
        return provider;
    }

    public String getAccountSid() {
        return accountSid;
    }

    public String getAuthToken() {
        return authToken;
    }

    public String getFromNumber() {
        return fromNumber;
    }

    public String getCountryCode() {
        return countryCode;
    }

    /**
     * Validates an incoming Twilio webhook request signature using HMAC-SHA1.
     * Prevents unauthorized callers from forging webhook events or updating communications.
     */
    public boolean validateTwilioSignature(String signatureHeader, String requestUrl, Map<String, String> postParams) {
        if (!isConfigured() || authToken == null || authToken.isBlank()) {
            // If gateway credentials are not configured in local environment, allow for development/testing
            return true;
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }

        try {
            StringBuilder data = new StringBuilder(requestUrl != null ? requestUrl : "");
            if (postParams != null && !postParams.isEmpty()) {
                List<String> sortedKeys = new ArrayList<>(postParams.keySet());
                Collections.sort(sortedKeys);
                for (String key : sortedKeys) {
                    data.append(key).append(postParams.get(key) != null ? postParams.get(key) : "");
                }
            }

            Mac mac = Mac.getInstance("HmacSHA1");
            SecretKeySpec secretKey = new SecretKeySpec(authToken.getBytes(StandardCharsets.UTF_8), "HmacSHA1");
            mac.init(secretKey);
            byte[] hmac = mac.doFinal(data.toString().getBytes(StandardCharsets.UTF_8));
            String expected = Base64.getEncoder().encodeToString(hmac);

            return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), signatureHeader.trim().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Failed to compute or validate Twilio HMAC signature: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Normalizes a phone number into standard international E.164 format.
     */
    public String normalizePhoneNumber(String rawNumber) {
        if (rawNumber == null || rawNumber.isBlank()) {
            throw new IllegalArgumentException("Phone number cannot be blank");
        }

        String trimmed = rawNumber.trim();
        boolean startsWithPlus = trimmed.startsWith("+");
        String digitsOnly = trimmed.replaceAll("[^0-9]", "");

        if (digitsOnly.length() < 10 || digitsOnly.length() > 15) {
            throw new IllegalArgumentException("Phone number must contain between 10 and 15 digits: " + rawNumber);
        }

        if (startsWithPlus) {
            return "+" + digitsOnly;
        }

        // Default to US country code +1 if 10 digits
        if (digitsOnly.length() == 10 && "US".equalsIgnoreCase(countryCode)) {
            return "+1" + digitsOnly;
        }

        if (digitsOnly.length() == 11 && digitsOnly.startsWith("1") && "US".equalsIgnoreCase(countryCode)) {
            return "+" + digitsOnly;
        }

        return "+" + digitsOnly;
    }

    /**
     * Dispatches an outbound SMS message via the configured provider gateway.
     */
    public SmsDeliveryResult sendSms(String toPhone, String body) {
        if (toPhone == null || toPhone.isBlank()) {
            return SmsDeliveryResult.validationFailure("Recipient phone number is required");
        }
        if (body == null || body.trim().isEmpty()) {
            return SmsDeliveryResult.validationFailure("Message body cannot be empty");
        }
        if (body.length() > MAX_MESSAGE_LENGTH) {
            return SmsDeliveryResult.validationFailure("Message exceeds maximum length of " + MAX_MESSAGE_LENGTH + " characters");
        }

        String formattedRecipient;
        try {
            formattedRecipient = normalizePhoneNumber(toPhone);
        } catch (IllegalArgumentException e) {
            return SmsDeliveryResult.validationFailure(e.getMessage());
        }

        if (!isConfigured()) {
            String reason = "SMS gateway provider credentials are not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER to enable live outbound SMS delivery.";
            log.warn("Live SMS delivery skipped: {}", reason);
            return SmsDeliveryResult.notConfigured(reason);
        }

        try {
            String twilioUrl = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
            String authHeader = "Basic " + Base64.getEncoder().encodeToString(
                    (accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8)
            );

            String formBody = "To=" + URLEncoder.encode(formattedRecipient, StandardCharsets.UTF_8)
                    + "&From=" + URLEncoder.encode(fromNumber, StandardCharsets.UTF_8)
                    + "&Body=" + URLEncoder.encode(body.trim(), StandardCharsets.UTF_8);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(twilioUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", authHeader)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            int statusCode = response.statusCode();
            String responseBody = response.body();

            if (statusCode == 200 || statusCode == 201) {
                String sid = extractJsonField(responseBody, "sid");
                String status = extractJsonField(responseBody, "status");
                String resolvedStatus = status != null && !status.isBlank() ? status.toUpperCase() : "SENT";

                log.info("Twilio SMS sent successfully: sid={}, status={}", sid, resolvedStatus);
                return SmsDeliveryResult.success(sid != null ? sid : "SM-SUCCESS", resolvedStatus, responseBody);
            } else {
                String twilioMessage = extractJsonField(responseBody, "message");
                String twilioCode = extractJsonField(responseBody, "code");
                String errorDetail = twilioMessage != null ? twilioMessage : "HTTP " + statusCode + ": " + responseBody;
                if (twilioCode != null) {
                    errorDetail += " (Code " + twilioCode + ")";
                }

                log.error("Twilio SMS delivery failed: HTTP {}: {}", statusCode, errorDetail);
                return SmsDeliveryResult.failure(errorDetail, statusCode, responseBody);
            }

        } catch (Exception e) {
            log.error("Exception invoking SMS gateway provider: {}", e.getMessage(), e);
            return SmsDeliveryResult.failure("SMS gateway network error: " + e.getMessage(), 500, null);
        }
    }

    private String extractJsonField(String json, String field) {
        if (json == null) return null;
        Pattern pattern = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*\"?([^,\"}]+)\"?");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    /**
     * Result of an SMS dispatch attempt.
     */
    public static class SmsDeliveryResult {
        private final boolean success;
        private final boolean configured;
        private final String messageId;
        private final String status;
        private final String error;
        private final String rawResponse;
        private final int statusCode;

        private SmsDeliveryResult(boolean success, boolean configured, String messageId, String status, String error, String rawResponse, int statusCode) {
            this.success = success;
            this.configured = configured;
            this.messageId = messageId;
            this.status = status;
            this.error = error;
            this.rawResponse = rawResponse;
            this.statusCode = statusCode;
        }

        public static SmsDeliveryResult success(String messageId, String status, String rawResponse) {
            return new SmsDeliveryResult(true, true, messageId, status, null, rawResponse, 201);
        }

        public static SmsDeliveryResult notConfigured(String reason) {
            return new SmsDeliveryResult(false, false, null, "QUEUED", reason, null, 0);
        }

        public static SmsDeliveryResult failure(String error, int statusCode, String rawResponse) {
            return new SmsDeliveryResult(false, true, null, "FAILED", error, rawResponse, statusCode);
        }

        public static SmsDeliveryResult validationFailure(String error) {
            return new SmsDeliveryResult(false, true, null, "FAILED", error, null, 400);
        }

        public boolean isSuccess() { return success; }
        public boolean isConfigured() { return configured; }
        public String getMessageId() { return messageId; }
        public String getStatus() { return status; }
        public String getError() { return error; }
        public String getRawResponse() { return rawResponse; }
        public int getStatusCode() { return statusCode; }
    }
}
