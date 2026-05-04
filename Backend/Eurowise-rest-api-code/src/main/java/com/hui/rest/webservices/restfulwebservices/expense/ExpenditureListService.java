package com.hui.rest.webservices.restfulwebservices.expense;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;


//Service class demo
@Service
public class ExpenditureListService {

    //Static list
    private static List<ExpenditureList> expList = new ArrayList<>() ;

    //To find the expense by type
    public List<ExpenditureList> findByType(String type){
        //List to store the result during the searching
        List<ExpenditureList> result = new ArrayList<>();

        //Store the data to the result using iteration
        for (ExpenditureList exp : expList) {
            if (exp.getType().equals(type)) {
                result.add(exp);
            }
        }
        return result;
    }
}
