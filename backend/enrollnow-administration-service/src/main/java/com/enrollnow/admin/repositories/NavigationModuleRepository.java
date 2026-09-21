package com.enrollnow.admin.repositories;

import com.enrollnow.admin.models.NavigationModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NavigationModuleRepository extends JpaRepository<NavigationModule, Integer> {
    List<NavigationModule> findAllByOrderByDisplayOrderAsc();
    Optional<NavigationModule> findByModuleCode(String moduleCode);
}
