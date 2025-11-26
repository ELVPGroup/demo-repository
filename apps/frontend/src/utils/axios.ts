import axios from "axios";

export const merchantAxiosInstance = axios.create({
  // 商家端mock地址
  baseURL: "http://127.0.0.1:4523/m1/7446832-7180926-6608925/api/merchant",
});

