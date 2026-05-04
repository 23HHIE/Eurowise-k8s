package com.hui.rest.webservices.restfulwebservices.expense.repository;

import com.hui.rest.webservices.restfulwebservices.expense.ExpenditureList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

//Expense repository interface for managing expenditureList entity
@Repository
public interface ExpenseRepository extends JpaRepository<ExpenditureList, Integer> {

    //To retrieve a list based on a given username
    List<ExpenditureList>  findByUsername(String username);

    //To retrieve a list based on a given username and expense type
    List<ExpenditureList> findByUsernameAndTypeContains(String username, String type);
}
