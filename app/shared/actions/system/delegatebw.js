import * as types from '../types';
import * as AccountActions from '../accounts';
import eos from '../helpers/eos';
import { payforcpunet } from '../helpers/eos';

export function delegatebw(delegator, receiver, netAmount, cpuAmount) {
  return (dispatch: () => void, getState) => {
    const {
      connection,
      settings
    } = getState();

    dispatch({
      type: types.SYSTEM_DELEGATEBW_PENDING
    });

    let actions = [
      {
        account: 'eosio',
        name: 'delegatebw',
        authorization: [{
          actor: delegator,
          permission: settings.authorization || 'active'
        }],
        data: delegatebwParams(delegator, receiver, netAmount, cpuAmount, 0, settings)
      }
    ];

    const payforaction = payforcpunet(delegator, getState());
    if (payforaction) actions = payforaction.concat(actions);

    return eos(connection, true, payforaction!==null).transaction({
      actions
    }).then((tx) => {
      dispatch(AccountActions.getAccount(delegator));
      return dispatch({
        payload: { tx },
        type: types.SYSTEM_DELEGATEBW_SUCCESS
      });
    }).catch((err) => dispatch({
      payload: { err },
      type: types.SYSTEM_DELEGATEBW_FAILURE
    }));
  };
}

export function delegatebwParams(delegator, receiver, netAmount, cpuAmount, transferTokens, settings) {
  const stakeNetAmount = parseFloat(netAmount) || 0;
  const stakeCpuAmount = parseFloat(cpuAmount) || 0;
  return {
    from: delegator,
    receiver,
    stake_net_quantity: `${stakeNetAmount.toFixed(settings.tokenPrecision)} ` + settings.blockchain.tokenSymbol,
    stake_cpu_quantity: `${stakeCpuAmount.toFixed(settings.tokenPrecision)} ` + settings.blockchain.tokenSymbol,
    transfer: transferTokens ? 1 : 0
  };
}

export default {
  delegatebw
};
