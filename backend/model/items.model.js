import db from "../database/db.js";
export default class Item{
    constructor({item_id,item_name,item_type,sales_price,gst_rate,measuring_unit,opening_stock,item_code,purchase_price,user_id}){
        this.item_id=item_id?item_id:null;
        this.item_name=item_name
        this.item_type=item_type?item_type:'product'
        this.sales_price=sales_price?sales_price:0
        this.gst_rate=gst_rate?gst_rate:0;
        this.measuring_unit=measuring_unit?measuring_unit:'PCS'
        this.opening_stock=opening_stock?opening_stock:null
        this.item_code=item_code?item_code:null
        this.purchase_price=purchase_price?purchase_price:0
        this.user_id=user_id

    }

    async save(){
        const sql="INSERT INTO items(item_name,item_type,sales_price,gst_rate,measuring_unit,opening_stock,item_code,purchase_price,user_id) VALUES (?,?,?,?,?,?,?,?,?);"
        const [result]=await db.execute(sql,[this.item_name,this.item_type,this.sales_price,this.gst_rate,this.measuring_unit,this.opening_stock,this.item_code,this.purchase_price,this.user_id]);
        return result;
    }
    async replace(){
        console.log("itemid :",this.item_id);
        const sql="REPLACE INTO items(item_id,item_name,item_type,sales_price,gst_rate,measuring_unit,opening_stock,item_code,purchase_price,user_id) VALUES (?,?,?,?,?,?,?,?,?,?);"
        const [result]=await db.execute(sql,[this.item_id,this.item_name,this.item_type,this.sales_price,this.gst_rate,this.measuring_unit,this.opening_stock,this.item_code,this.purchase_price,this.user_id]);
        return result
    }

    static async allParty(userID){
        const sql="SELECT users.id AS usersID,parties.id AS partiesID ,users.* ,parties.* FROM users JOIN parties ON users.id=?"
        const result=await db.execute(sql,[userID]);
        return result[0];
    }

    static async findById(item_id,user_id){
        const sql="SELECT * from items where item_id=? AND user_id=?;"
        const [result]=await db.execute(sql,[item_id,user_id]);
        // console.log(result[0]);
        if(result.length==0)
            return {}
        const newItem=new Item(result[0]);
        console.log("newItem:",newItem);
        return newItem
    }
}

// const item_data={
//     item_name:'maggie',
//     sales_price:'25',
//     user_id:14
// }

// const item=new Item(item_data)
// const result=await(item.save())
// console.log(result);
