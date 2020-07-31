import * as types from '../actions/types';

const initialState = {
  data: false
};

export default function wallet(state = initialState, action) {
  switch (action.type) {
    case types.WALLET_REMOVE:
    case types.RESET_ALL_STATES: {
      return Object.assign({}, initialState);
    }
    case types.SET_WALLET_ACTIVE: {
      return Object.assign({}, state, {
        account: action.payload.account,
        accountData: action.payload.accountData,
        authorization: action.payload.authorization,
        data: action.payload.data,
        mode: action.payload.mode,
        pubkey: action.payload.pubkey,
        chainId: action.payload.chainId
      });
    }
    default: {
      return state;
    }
  }
}
