export interface IcreateUser {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface IsignInUser {
  email: string;
  password: string;
}
