package com.enrollnow.repository;

import com.enrollnow.models.NavigationLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NavigationLinkRepository extends JpaRepository<NavigationLink, Integer> {
    Optional<NavigationLink> findByLinkCode(String linkCode);
    List<NavigationLink> findByModuleIdOrderByDisplayOrderAsc(Integer moduleId);
    List<NavigationLink> findByActiveOrderByDisplayOrderAsc(boolean active);
}
