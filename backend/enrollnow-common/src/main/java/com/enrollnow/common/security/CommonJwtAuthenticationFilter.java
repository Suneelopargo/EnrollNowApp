package com.enrollnow.common.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CommonJwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    public CommonJwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                Claims claims = tokenProvider.getClaims(jwt);
                String username = claims.getSubject();
                Number userIdNum = claims.get("userId", Number.class);
                Long userId = userIdNum != null ? userIdNum.longValue() : null;
                Number orgIdNum = claims.get("organizationId", Number.class);
                Long organizationId = orgIdNum != null ? orgIdNum.longValue() : null;

                @SuppressWarnings("unchecked")
                List<String> roles = claims.get("roles", List.class);
                List<SimpleGrantedAuthority> authorities = roles != null
                        ? roles.stream().map(r -> new SimpleGrantedAuthority(r.startsWith("ROLE_") ? r : "ROLE_" + r)).collect(Collectors.toList())
                        : Collections.emptyList();

                UserPrincipal principal = new UserPrincipal(
                        userId,
                        username,
                        "",
                        "",
                        true,
                        organizationId,
                        authorities
                );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
