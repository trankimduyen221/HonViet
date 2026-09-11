package com.honviet.app.dto;

public class OrderDetailDTO {
    private Integer uniqueId;
    private Integer foodId;
    private String foodName;
    private Integer quantity;
    private Double price;

    // Getters và Setters
    public Integer getUniqueId() { return uniqueId; }
    public void setUniqueId(Integer uniqueId) { this.uniqueId = uniqueId; }

    public Integer getFoodId() { return foodId; }
    public void setFoodId(Integer foodId) { this.foodId = foodId; }

    public String getFoodName() { return foodName; }
    public void setFoodName(String foodName) { this.foodName = foodName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
}