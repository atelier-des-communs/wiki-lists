
export interface IUser  {
    _id: string;
    email:string;
}

export interface IToken {
    _id:string;
    email:string;
    createdAt: Date;
    redirect?:string;
}
