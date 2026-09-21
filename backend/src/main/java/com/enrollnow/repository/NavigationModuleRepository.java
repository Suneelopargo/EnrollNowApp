package com.enrollnow.repository;

import com.enrollnow.models.NavigationModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NavigationModuleRepository extends JpaRepository<NavigationModule, Integer> {
    Optional<NavigationModule> findByModuleCode(String moduleCode);
    List<NavigationModule> findByActiveOrderByDisplayOrderAsc(boolean active);
}
