package com.enrollnow.participant.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmsGatewayServiceTest {

    @Mock
    private HttpClient mockHttpClient;

    @Mock
    private HttpResponse<String> mockHttpResponse;

    private SmsGatewayService configuredGateway;
    private SmsGatewayService unconfiguredGateway;

    private final String accountSid = "ACtest1234567890abcdef1234567890ab";
    private final String authToken = "secret_auth_token_987654321";
    private final String fromNumber = "+15551234567";

    @BeforeEach
    void setUp() {
        configuredGateway = new SmsGatewayService(
                "twilio",
                accountSid,
                authToken,
                fromNumber,
                "US",
                mockHttpClient
        );

        unconfiguredGateway = new SmsGatewayService(
                "twilio",
                "",
                "",
                "",
                "US",
                mockHttpClient
        );
    }

    @Test
    void isConfigured_reflectsCredentialsPresence() {
        assertTrue(configuredGateway.isConfigured());
        assertFalse(unconfiguredGateway.isConfigured());
    }

    @Test
    void sendSms_unconfiguredCredentials_returnsQueuedStatusWithoutHttpDispatch() throws Exception {
        SmsGatewayService.SmsDeliveryResult result = unconfiguredGateway.sendSms("+12155550199", "Hello there");

        assertFalse(result.isSuccess());
        assertFalse(result.isConfigured());
        assertEquals("QUEUED", result.getStatus());
        assertNotNull(result.getError());
        assertTrue(result.getError().contains("not configured"));

        // Verify zero HTTP requests were made
        verify(mockHttpClient, never()).send(any(), any());
    }

    @Test
    void sendSms_exceeds1600Chars_returnsValidationFailure() throws Exception {
        String longBody = "A".repeat(1601);
        SmsGatewayService.SmsDeliveryResult result = configuredGateway.sendSms("+12155550199", longBody);

        assertFalse(result.isSuccess());
        assertEquals("FAILED", result.getStatus());
        assertTrue(result.getError().contains("maximum length of 1600"));
        verify(mockHttpClient, never()).send(any(), any());
    }

    @Test
    void sendSms_blankPhoneOrBody_returnsValidationFailure() throws Exception {
        SmsGatewayService.SmsDeliveryResult blankPhone = configuredGateway.sendSms("", "Hello");
        assertFalse(blankPhone.isSuccess());
        assertEquals("FAILED", blankPhone.getStatus());

        SmsGatewayService.SmsDeliveryResult blankBody = configuredGateway.sendSms("+12155550199", "   ");
        assertFalse(blankBody.isSuccess());
        assertEquals("FAILED", blankBody.getStatus());

        verify(mockHttpClient, never()).send(any(), any());
    }

    @Test
    void sendSms_successResponse201_returnsSuccessWithExternalMessageId() throws Exception {
        String twilioJson = "{\"sid\": \"SM9988776655\", \"status\": \"queued\", \"to\": \"+12155550199\"}";
        when(mockHttpResponse.statusCode()).thenReturn(201);
        when(mockHttpResponse.body()).thenReturn(twilioJson);
        doReturn(mockHttpResponse).when(mockHttpClient).send(any(), any());

        SmsGatewayService.SmsDeliveryResult result = configuredGateway.sendSms("(215) 555-0199", "Appointment reminder");

        assertTrue(result.isSuccess());
        assertEquals("SM9988776655", result.getMessageId());
        assertEquals("QUEUED", result.getStatus());
        assertNull(result.getError());

        ArgumentCaptor<HttpRequest> requestCaptor = ArgumentCaptor.forClass(HttpRequest.class);
        verify(mockHttpClient).send(requestCaptor.capture(), any());

        HttpRequest captured = requestCaptor.getValue();
        assertEquals("POST", captured.method());
        assertTrue(captured.uri().toString().contains("/Accounts/" + accountSid + "/Messages.json"));
        assertTrue(captured.headers().firstValue("Authorization").orElse("").startsWith("Basic "));
    }

    @Test
    void sendSms_providerAuthenticationFailure401_returnsFailureWithStatusCode() throws Exception {
        String twilioErrorJson = "{\"code\": 20003, \"message\": \"Authentication Error - No credentials provided\", \"status\": 401}";
        when(mockHttpResponse.statusCode()).thenReturn(401);
        when(mockHttpResponse.body()).thenReturn(twilioErrorJson);
        doReturn(mockHttpResponse).when(mockHttpClient).send(any(), any());

        SmsGatewayService.SmsDeliveryResult result = configuredGateway.sendSms("+12155550199", "Hello");

        assertFalse(result.isSuccess());
        assertEquals("FAILED", result.getStatus());
        assertEquals(401, result.getStatusCode());
        assertTrue(result.getError().contains("Authentication Error"));
        assertTrue(result.getError().contains("20003"));
    }

    @Test
    void sendSms_providerRejection400_returnsFailureWithErrorDetail() throws Exception {
        String twilioErrorJson = "{\"code\": 21211, \"message\": \"The 'To' number is not a valid phone number.\", \"status\": 400}";
        when(mockHttpResponse.statusCode()).thenReturn(400);
        when(mockHttpResponse.body()).thenReturn(twilioErrorJson);
        doReturn(mockHttpResponse).when(mockHttpClient).send(any(), any());

        SmsGatewayService.SmsDeliveryResult result = configuredGateway.sendSms("+10000000000", "Hello");

        assertFalse(result.isSuccess());
        assertEquals("FAILED", result.getStatus());
        assertEquals(400, result.getStatusCode());
        assertTrue(result.getError().contains("not a valid phone number"));
        assertTrue(result.getError().contains("21211"));
    }

    @Test
    void sendSms_networkException_returnsFailureWith500() throws Exception {
        when(mockHttpClient.send(any(HttpRequest.class), any())).thenThrow(new java.net.http.HttpTimeoutException("Connection timed out"));

        SmsGatewayService.SmsDeliveryResult result = configuredGateway.sendSms("+12155550199", "Test timeout");

        assertFalse(result.isSuccess());
        assertEquals("FAILED", result.getStatus());
        assertEquals(500, result.getStatusCode());
        assertTrue(result.getError().contains("timed out"));
    }

    @Test
    void normalizePhoneNumber_formatsCorrectly() {
        assertEquals("+12155550199", configuredGateway.normalizePhoneNumber("2155550199"));
        assertEquals("+12155550199", configuredGateway.normalizePhoneNumber("(215) 555-0199"));
        assertEquals("+12155550199", configuredGateway.normalizePhoneNumber("+1 (215) 555-0199"));
        assertEquals("+447700900077", configuredGateway.normalizePhoneNumber("+44 7700 900077"));

        assertThrows(IllegalArgumentException.class, () -> configuredGateway.normalizePhoneNumber("123"));
        assertThrows(IllegalArgumentException.class, () -> configuredGateway.normalizePhoneNumber(""));
    }

    @Test
    void validateTwilioSignature_verifiesHmacSha1() throws Exception {
        String url = "https://example.com/api/v1/participants/sms/webhook";
        Map<String, String> params = new LinkedHashMap<>();
        params.put("MessageSid", "SM12345");
        params.put("MessageStatus", "delivered");
        params.put("To", "+12155550199");

        // Manually compute valid signature
        StringBuilder data = new StringBuilder(url);
        List<String> sortedKeys = new ArrayList<>(params.keySet());
        Collections.sort(sortedKeys);
        for (String k : sortedKeys) {
            data.append(k).append(params.get(k));
        }

        Mac mac = Mac.getInstance("HmacSHA1");
        SecretKeySpec keySpec = new SecretKeySpec(authToken.getBytes(StandardCharsets.UTF_8), "HmacSHA1");
        mac.init(keySpec);
        String validSig = Base64.getEncoder().encodeToString(mac.doFinal(data.toString().getBytes(StandardCharsets.UTF_8)));

        // 1. Valid signature passes
        assertTrue(configuredGateway.validateTwilioSignature(validSig, url, params));

        // 2. Tampered signature fails
        assertFalse(configuredGateway.validateTwilioSignature("invalid_signature_base64", url, params));

        // 3. Null or blank signature fails
        assertFalse(configuredGateway.validateTwilioSignature(null, url, params));
        assertFalse(configuredGateway.validateTwilioSignature("", url, params));

        // 4. Tampered URL fails
        assertFalse(configuredGateway.validateTwilioSignature(validSig, "https://evil.com/webhook", params));

        // 5. Tampered parameter value fails
        Map<String, String> tamperedParams = new HashMap<>(params);
        tamperedParams.put("MessageStatus", "failed");
        assertFalse(configuredGateway.validateTwilioSignature(validSig, url, tamperedParams));

        // 6. Unconfigured gateway allows development fallback
        assertTrue(unconfiguredGateway.validateTwilioSignature(null, url, params));
    }
}
