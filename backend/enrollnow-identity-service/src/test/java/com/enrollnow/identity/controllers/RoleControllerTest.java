package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.RoleResponse;
import com.enrollnow.identity.services.RoleService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleControllerTest {

    @Mock
    private RoleService roleService;

    @InjectMocks
    private RoleController roleController;

    @Test
    void getRoles_delegatesToRoleService() {
        RoleResponse response = new RoleResponse(
                UUID.randomUUID(),
                "SITE_ADMIN",
                "Site Admin",
                "SITE",
                "Description",
                true,
                true
        );

        when(roleService.getRoles("SITE")).thenReturn(List.of(response));

        ResponseEntity<List<RoleResponse>> result = roleController.getRoles("SITE");

        assertEquals(200, result.getStatusCode().value());
        assertNotNull(result.getBody());
        assertEquals(1, result.getBody().size());
        assertEquals("SITE_ADMIN", result.getBody().get(0).getCode());
        verify(roleService, times(1)).getRoles("SITE");
    }
}
