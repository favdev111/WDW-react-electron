import * as types from './types';
import { clearAccountCache, refreshAccountBalances } from './accounts';
import * as validate from './validate';
import { removeWallet, setWalletMode } from './wallet';

const { remote } = require('electron');

export function clearSettingsCache() {
  return (dispatch: () => void) => {
    dispatch({
      type: types.RESET_ALL_STATES
    });
    remote.getCurrentWindow().reload();
  };
}

export function clearSettingsInvalid() {
  return (dispatch: () => void) => {
    dispatch({
      type: types.RESET_INVALID_SETTINGS
    });
  };
}

export function resetApp() {
  return (dispatch: () => void) => {
    dispatch(clearSettingsCache());
    dispatch(clearAccountCache());
    dispatch(validate.clearValidationState());
    dispatch(removeWallet());
    dispatch(setSetting('skipImport', false));
    dispatch(setWalletMode('hot'));
  };
}

export function setSetting(key, value) {
  return (dispatch: () => void) => {
    dispatch({
      type: types.SET_SETTING,
      payload: {
        [key]: value
      }
    });
  };
}

export function setSettings(values) {
  return (dispatch: () => void) => {
    dispatch({
      type: types.SET_SETTING,
      payload: values
    });
  };
}

export function setSettingWithValidation(key, value) {
  return (dispatch: () => void) => {
    switch (key) {
      case 'account': {
        dispatch(validate.validateAccount(value));
        break;
      }
      case 'node': {
        // If nodes are changing, force clear any locally cached data
        dispatch({ type: types.CLEAR_ACCOUNT_CACHE });
        dispatch({ type: types.CLEAR_PRODUCER_CACHE });
        dispatch(validate.validateNode(value));
        break;
      }
      default: {
        break;
      }
    }
    dispatch({
      type: types.SET_SETTING,
      payload: {
        [key]: value
      }
    });
  };
}

export function addCustomToken(contract, symbol) {
  return (dispatch: () => void, getState) => {
    const { settings } = getState();
    const { customTokens } = settings;

    const name = [contract.toLowerCase(), symbol.toUpperCase()].join(':');

    let tokens = [];
    if (customTokens) {
      tokens = customTokens.slice(0);
    }

    if (name && name.length > 0) {
      tokens.push(name);
      tokens = new Set(tokens.filter((e) => e));
      dispatch(setSetting('customTokens', Array.from(tokens)));
    }
    return dispatch(refreshAccountBalances(settings.account, [name]));
  };
}

export function removeCustomToken(contract, symbol) {
  return (dispatch: () => void, getState) => {
    const { settings } = getState();
    const { customTokens } = settings;

    const name = [contract.toLowerCase(), symbol.toUpperCase()].join(':');

    let tokens = [];
    if (customTokens) {
      tokens = customTokens.slice(0);
    }

    const position = tokens.indexOf(name);
    if (position >= 0) {
      tokens.splice(position, 1);
      tokens = new Set(tokens.filter((e) => e));
      dispatch(setSetting('customTokens', Array.from(tokens)));
    }
    return dispatch(refreshAccountBalances(settings.account, [name]));
  };
}

export function changeCoreTokenSymbol(symbol) {
  return (dispatch: () => void, getState) => {
    const { settings } = getState();
    const { customTokens } = settings;

    const coreToken = ["eosio.token", symbol.toUpperCase()].join(':');

    let tokens = [];
    if (customTokens) {
      tokens = customTokens.slice(0);
    }

    tokens[0] = coreToken;
    tokens = new Set(tokens.filter((e) => e));
    dispatch(setSetting('customTokens', Array.from(tokens)));
  };
}

export function addBlockchain(blockchain, tokenSymbol, node, chainId) {
  return (dispatch: () => void, getState) => {
    const { settings } = getState();
    const { blockchains } = settings;

    let chains = [];
    if (blockchains) {
      chains = blockchains.slice(0);
    }

    if (blockchain && blockchain.length > 0 && tokenSymbol && tokenSymbol.length > 0) {
      chains.push({
        blockchain: blockchain,
        tokenSymbol: tokenSymbol,
        node: node,
        chainId: chainId
      });
      chains = new Set(chains.filter((e) => e));
      dispatch(setSetting('blockchains', Array.from(chains)));
    }
  };
}

export function removeBlockchain(chainId) {
  return (dispatch: () => void, getState) => {
    const { settings } = getState();
    const { blockchains } = settings;

    const newChains = blockchains.filter((c) => {return c.chainId !== chainId});
    if (newChains) {
      const chains = new Set(newChains.filter((e) => e));
      dispatch(setSetting('blockchains', Array.from(chains)));
    }
  };
}

export default {
  addBlockchain,
  addCustomToken,
  changeCoreTokenSymbol,
  clearSettingsCache,
  clearSettingsInvalid,
  removeBlockchain,
  removeCustomToken,
  setSetting,
  setSettings,
  setSettingWithValidation
};
