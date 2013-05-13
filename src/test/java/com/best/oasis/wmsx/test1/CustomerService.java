package com.best.oasis.wmsx.test1;

import java.util.Collection;

import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
  
/**
 * application/xml
 * application/json
 */

@Path("/customer")   
@Produces("application/xml")  
public interface CustomerService {  
    
    @GET  
    @Path("/info/{id}")  
    Customer getCustomerById(@PathParam("id") String id);  
    
    @GET  
    @Path("/info/")  
    Collection<Customer> getCustomerList();  
       
    @DELETE  
    @Path("/info/{id}")  
    void deleteCustomer(@PathParam("id") String id);  
    
    @PUT 
    @Path("/info/")  
    @Consumes( { 
            MediaType.APPLICATION_XML, 
            MediaType.APPLICATION_JSON })
    void createCustomer(Customer customer); 
    
    @POST 
    @Path("/info/")  
    @Consumes( { 
            MediaType.APPLICATION_XML, 
            MediaType.APPLICATION_JSON })
    void updateCustomer(Customer customer);  
    
    
    @GET  
    @Path("/search")  
    Customer queryCustomerByName(@QueryParam("name") String name);  
    
}  
