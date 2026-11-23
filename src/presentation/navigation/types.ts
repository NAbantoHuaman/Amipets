import { NavigatorScreenParams } from '@react-navigation/native';
import { OrderStatus } from '../../domain/models/order';
import { Priority, RequestStatus, ServiceType, Species } from '../../domain/models/request';

export type TabParamList = {
  Home: undefined;
  Requests:
    | {
        status?: RequestStatus | 'TODOS';
        priority?: Priority | 'TODAS';
        nonce?: number;
      }
    | undefined;
  Orders:
    | {
        status?: OrderStatus | 'TODOS';
        nonce?: number;
      }
    | undefined;
  Catalog: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Calendar: undefined;
  BreedGuide: undefined;
  CreateRequest:
    | {
        requestId?: string;
        service?: ServiceType;
        initialDate?: string;
        initialSpecies?: Species;
        initialBreed?: string;
      }
    | undefined;
  RequestDetail: { requestId: string };
  CreateOrder:
    | {
        orderId?: string;
        initialProductId?: number;
        initialQuantity?: number;
        initialClientName?: string;
        initialPhone?: string;
        initialPetName?: string;
        initialSpecies?: Species;
      }
    | undefined;
  OrderDetail: { orderId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
