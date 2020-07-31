import * as types from './types';
import { setSetting } from './settings';
import eos from './helpers/eos';
import EOSAccount from '../utils/EOS/Account';

const CryptoJS = require('crypto-js');
const ecc = require('eosjs-ecc');

export function setWalletKey(data, password, mode = 'hot', existingHash = false, auth = false) {
  return (dispatch: () => void, getState) => {
    const { accounts, settings, connection } = getState();
    let hash = existingHash;
    let key = data;
    let obfuscated = data;
    if (existingHash) {
      key = decrypt(data, existingHash, 1).toString(CryptoJS.enc.Utf8);
    } else {
      hash = encrypt(password, password, 1).toString(CryptoJS.enc.Utf8);
      obfuscated = encrypt(key, hash, 1).toString(CryptoJS.enc.Utf8);
    }
    
    const pubkey = ecc.privateToPublic(key);
    const accountData = accounts[settings.account];
    let authorization;
    if (auth) {
      authorization = auth;
    } else if (accountData) {
      const detectedAuth = new EOSAccount(accountData).getAuthorization(pubkey);
      if (detectedAuth) {
        [, authorization] = auth.split('@');
      }
    }
    dispatch({
      type: types.SET_WALLET_KEYS_ACTIVE,
      payload: {
        account: settings.account,
        accountData: accounts[settings.account],
        authorization,
        hash,
        key: obfuscated,
        pubkey
      }
    });
    return dispatch({
      type: types.SET_WALLET_ACTIVE,
      payload: {
        account: settings.account,
        accountData: accounts[settings.account],
        authorization,
        data: encrypt(key, password),
        mode,
        pubkey,
        chainId: settings.blockchain.chainId
      }
    });
  };
}

export function setWalletHash(password) {
  return (dispatch: () => void) => {
    const hash = encrypt('VALID', password).toString(CryptoJS.enc.Utf8);
    dispatch({
      payload: { hash },
      type: types.SET_WALLET_HASH
    });
  };
}

export function setTemporaryKey(key, authorization = 'active') {
  return (dispatch: () => void, getState) => {
    const { settings } = getState();
    const pubkey = (key) ? ecc.privateToPublic(key) : '';
    // Obfuscate key for in-memory storage
    const hash = encrypt(key, key, 1).toString(CryptoJS.enc.Utf8);
    const obfuscated = encrypt(key, hash, 1).toString(CryptoJS.enc.Utf8);
    
    dispatch({
      type: types.SET_WALLET_KEYS_TEMPORARY,
      payload: {
        account: settings.account,
        authorization,
        hash,
        key: obfuscated,
        pubkey
      }
    });
  };
}

export function lockWallet() {
  return (dispatch: () => void, getState) => {
    const { settings } = getState();
    dispatch({
      type: types.WALLET_LOCK,
      payload: {
        settings
      }
    });
  };
}

export function removeWallet(account, chainId, authorization) {
  return (dispatch: () => void) => {
    dispatch({
      type: types.WALLET_REMOVE,
      payload: {
        account,
        authorization,
        chainId,
      }
    });
  };
}

export function validateWalletPassword(password, useWallet = false) {
  return (dispatch: () => void, getState) => {
    let { wallet } = getState();
    // If a wallet was passed to be used, use that instead of state.
    if (useWallet && useWallet.data) {
      wallet = useWallet;
    }
    dispatch({
      type: types.VALIDATE_WALLET_PASSWORD_PENDING
    });
    setTimeout(() => {
      try {
        const key = decrypt(wallet.data, password).toString(CryptoJS.enc.Utf8);
        if (ecc.isValidPrivate(key) === true) {
          return dispatch({
            type: types.VALIDATE_WALLET_PASSWORD_SUCCESS
          });
        }
      } catch (err) {
        return dispatch({
          err,
          type: types.VALIDATE_WALLET_PASSWORD_FAILURE
        });
      }
      return dispatch({
        type: types.VALIDATE_WALLET_PASSWORD_FAILURE
      });
    }, 10);
  };
}

export function unlockWallet(password, useWallet = false) {
  return async (dispatch: () => void, getState) => {
    const state = getState();
    const {
      accounts,
      connection,
      settings
    } = state;
    let { wallet } = state;
    // If a wallet was passed to be used, use that instead of state.
    if (useWallet && useWallet.data) {
      wallet = useWallet;
    }
    let account = accounts[wallet.account];
    if (settings.walletMode === 'hot' && !account) {
      account = await eos(connection).getAccount(wallet.account);
    }
    
    dispatch({
      type: types.VALIDATE_WALLET_PASSWORD_PENDING
    });
    setTimeout(() => {
      try {
        let key = decrypt(wallet.data, password).toString(CryptoJS.enc.Utf8);
        if (ecc.isValidPrivate(key) === true) {
          const pubkey = ecc.privateToPublic(key);
          // Set the active wallet
          dispatch({
            payload: {
              ...wallet,
              accountData: account,
              pubkey
            },
            type: types.SET_WALLET_ACTIVE
          });
          // Obfuscate key for in-memory storage
          const hash = encrypt(password, password, 1).toString(CryptoJS.enc.Utf8);
          key = encrypt(key, hash, 1).toString(CryptoJS.enc.Utf8);
          // Set the keys for use
          dispatch({
            payload: {
              account: wallet.account,
              accountData: account,
              authorization: wallet.authorization,
              hash,
              key,
              pubkey
            },
            type: types.SET_WALLET_KEYS_ACTIVE
          });
          if (!settings.walletHash) {
            dispatch(setWalletHash(password));
          }
          return dispatch({
            type: types.VALIDATE_WALLET_PASSWORD_SUCCESS
          });
        }
      } catch (err) {
        return dispatch({
          err,
          type: types.VALIDATE_WALLET_PASSWORD_FAILURE
        });
      }
      return dispatch({
        type: types.VALIDATE_WALLET_PASSWORD_FAILURE
      });
    }, 10);
  };
}

export function setWalletMode(walletMode) {
  return (dispatch: () => void) => {
    // Set the wallet mode
    dispatch(setSetting('walletMode', walletMode));
    switch (walletMode) {
      case 'cold': {
        // Remove any connection string we had
        dispatch(setSetting('node', null));
        return dispatch({
          type: types.SET_WALLET_COLD
        });
      }
      case 'watch': {
        return dispatch({
          type: types.SET_WALLET_WATCH
        });
      }
      case 'ledger': {
        return dispatch({
          type: types.SET_WALLET_LEDGER
        });
      }
      default: {
        return dispatch({
          type: types.SET_WALLET_HOT
        });
      }
    }
  };
}

export function encrypt(data, pass, iterations = 4500) {
  const keySize = 256;
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const key = CryptoJS.PBKDF2(pass, salt, {
    iterations,
    keySize: keySize / 4
  });
  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return salt.toString() + iv.toString() + encrypted.toString();
}

export function decrypt(data, pass, iterations = 4500) {
  const keySize = 256;
  const salt = CryptoJS.enc.Hex.parse(data.substr(0, 32));
  const iv = CryptoJS.enc.Hex.parse(data.substr(32, 32));
  const encrypted = data.substring(64);
  const key = CryptoJS.PBKDF2(pass, salt, {
    iterations,
    keySize: keySize / 4
  });
  const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC
  });
  return decrypted;
}

export default {
  decrypt,
  encrypt,
  lockWallet,
  unlockWallet,
  removeWallet,
  setTemporaryKey,
  setWalletKey,
  validateWalletPassword
};
