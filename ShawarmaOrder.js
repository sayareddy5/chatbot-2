const Order = require("./Order");

const OrderState = Object.freeze({
    WELCOMING: Symbol("welcoming"),
    ITEM: Symbol("item"),
    SIZE: Symbol("size"),
    TOPPINGS: Symbol("toppings"),
    DRINKS: Symbol("drinks"),
    PAYMENT: Symbol("payment")
});

class ShwarmaOrder extends Order {
    constructor(sNumber, sUrl) {
        super(sNumber, sUrl);
        this.stateCur = OrderState.WELCOMING;
        this.selectedItem = "";
        this.selectedSize = "";
        this.selectedToppings = [];
        this.selectedDrink = "";
        this.totalPrice = 0;
    }

    handleInput(sInput) {
        let aReturn = [];
        switch (this.stateCur) {
            case OrderState.WELCOMING:
                this.stateCur = OrderState.ITEM;
                aReturn.push("Welcome to Reddy's Food Delivery!");
                aReturn.push("Please choose an item from the menu: shawarma, burger, pizza");
                break;
            case OrderState.ITEM:
                this.selectedItem = sInput.toLowerCase();
                if (this.selectedItem === "shawarma" || this.selectedItem === "burger" || this.selectedItem === "pizza") {
                    this.stateCur = OrderState.SIZE;
                    aReturn.push(`Great choice! What size would you like for your ${this.selectedItem}?`);
                } else {
                    aReturn.push("Sorry, we don't have that item. Please choose from shawarma, burger, or pizza.");
                }
                break;
            case OrderState.SIZE:
                this.selectedSize = sInput.toLowerCase();
                if (menu[this.selectedItem].sizes.includes(this.selectedSize)) {
                    this.stateCur = OrderState.TOPPINGS;
                    aReturn.push(`Got it! What toppings would you like on your ${this.selectedItem}?`);
                } else {
                    aReturn.push("Sorry, that size is not available for the selected item. Please choose a different size.");
                }
                break;
            case OrderState.TOPPINGS:
                this.selectedToppings = sInput.toLowerCase().split(",");
                this.stateCur = OrderState.DRINKS;
                aReturn.push("Would you like to add a drink? (soda, water, juice)");
                break;
            case OrderState.DRINKS:
                this.selectedDrink = sInput.toLowerCase();
                this.stateCur = OrderState.PAYMENT;
                console.log("in drinks")
                // this.isDone(true);
                this.calculateTotalPrice();
                aReturn.push(`Your order summary: ${this.selectedSize} ${this.selectedItem} with ${this.selectedToppings.join(", ")} and ${this.selectedDrink}`);
                aReturn.push(`Total Price: $${this.totalPrice}`);
                aReturn.push(`To complete your order, please make a payment here: ${this.sUrl}/payment/${this.sNumber}`);
                break;
            case OrderState.PAYMENT:
                console.log("in payemnt")
                this.isDone(true);
                let d = new Date();
                d.setMinutes(d.getMinutes() + 20);
                const address = sInput.payer.address.country_code
                aReturn.push(`Your order will be delivered to ${address}`);
                aReturn.push(`Your order will be deliverd in at ${d.toTimeString()}`);
                break;
        
        }
        return aReturn;
    }

    calculateTotalPrice() {
        let itemPrice = menu[this.selectedItem].price[this.selectedSize];
        let toppingsPrice = this.selectedToppings.length * 1; // $1 per topping
        let drinkPrice = this.selectedDrink ? menu.drink.price : 0;
        this.totalPrice = itemPrice + toppingsPrice + drinkPrice;
    }
    renderForm(sTitle = "-1", sAmount = "-1") {
      // Your client id should be kept private
      const sClientID = process.env.SB_CLIENT_ID || "AeQdGUflck9iWaL4JKunPOy1B44kOo0lBYvu5mVAwgo0jjQy7IViUoNYhL01pVzhse1Ebm6s5EKfwpys";
      if (sTitle !== "-1") {
          this.sItem = sTitle;
      }
      if (sAmount !== "-1") {
          this.nOrder = sAmount;
        //   console.log("amount: ",this.nOrder);
      }

    //   console.log("inside renderForm")
      return(`
          <!DOCTYPE html>
          <html>
          <head>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <meta http-equiv="X-UA-Compatible" content="IE=edge" />
              <style>
                .order-message{
                    font-size: 30px;

                }
                .item-related{
                    font-weight: bolder;
                    text-transform: capitalize;
                }
                #paypal-button-container{
                    margin-top: 50px;
                }
              </style>
          </head>
          <body>
              <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
              <script src="https://www.paypal.com/sdk/js?client-id=${sClientID}"></script>
              Thank you ${this.sNumber} for your ${this.sItem} order of $${this.nOrder}.
              
              <div id="paypal-button-container"></div>
              <script>
                  paypal.Buttons({
                      createOrder: function(data, actions) {
                          return actions.order.create({
                              purchase_units: [{
                                  amount: {
                                      value: '${this.nOrder}'
                                  }
                              }]
                          });
                      },
                      onApprove: function(data, actions) {
                          return actions.order.capture().then(function(details) {
                              $.post(".", details, () => {
                                  window.open("", "_self");
                                  window.close();
                              });
                          });
                      }
                  }).render('#paypal-button-container');
              </script>
          </body>
          </html>
      `);
  }
}



const menu = {
    "shawarma": {
        "sizes": ["small", "medium", "large"],
        "price": {
            "small": 8,
            "medium": 10,
            "large": 12
        }
    },
    "burger": {
        "sizes": ["regular", "large"],
        "price": {
            "regular": 7,
            "large": 9
        }
    },
    "pizza": {
        "sizes": ["small", "medium", "large"],
        "price": {
            "small": 10,
            "medium": 14,
            "large": 18
        }
    },
    "drink": {
        "price": 2
    }
};

module.exports = ShwarmaOrder;
