package com.enrollnow.common.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String username;
    private final String email;
    private final String password;
    private final boolean active;
    private final Long organizationId;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(Long id, String username, String email, String password, boolean active,
                         Long organizationId, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.active = active;
        this.organizationId = organizationId;
        this.authorities = authorities;
    }

    public static UserPrincipal create(Long id, String username, String email, String password,
                                      boolean active, Long organizationId, List<String> roleCodes) {
        List<GrantedAuthority> authorities = roleCodes.stream()
                .map(role -> new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role))
                .collect(Collectors.toList());

        return new UserPrincipal(id, username, email, password, active, organizationId, authorities);
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
