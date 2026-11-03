import { RegisterUserInput, Session, User } from '../models/user';

export interface IAuthRepository {
  login(userName: string, password: string): Promise<Session | null>;
  register(input: RegisterUserInput): Promise<Session>;
  getUserByUsername(userName: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
}
