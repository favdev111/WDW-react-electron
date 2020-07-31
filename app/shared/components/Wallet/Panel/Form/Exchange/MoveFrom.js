// @flow
import React, { Component } from 'react';
import { translate } from 'react-i18next';
import { Decimal } from 'decimal.js';

import { Segment, Form, Divider, Message, Button, Header } from 'semantic-ui-react';

import WalletPanelFormExchangeSavingsStats from './Form/FromSavingsStats';
import WalletPanelFormExchangeMoveFromConfirming from './Form/MoveFromConfirming';
import FormMessageError from '../../../../Global/Form/Message/Error';

import GlobalFormFieldToken from '../../../../Global/Form/Field/Token';

type Props = {
  balance: {},
  system: {}
};

class WalletPanelFormExchangeMoveFrom extends Component<Props> {
  props: Props;

  constructor(props) {
    super(props);
    let { rex } = props;

    const rexBalance = rex.rexbal && rex.rexbal.rex_balance 
      ? Decimal(rex.rexbal.rex_balance.split(' ')[0]) : 0;
    const totalRex = rex.rexpool.total_rex.split(' ')[0];
    const totalLendable = rex.rexpool.total_lendable.split(' ')[0];
    const coreBalance = totalRex > 0 ? parseFloat(totalLendable) / parseFloat(totalRex) * rexBalance : 0;
    let savingsRex = rex.rexbal ? 
         rex.rexbal.rex_maturities 
      && rex.rexbal.rex_maturities[1]
      && rex.rexbal.rex_maturities[1].second
      && Decimal(rex.rexbal.rex_maturities[1].second) / 10000 : 0;

    if (!savingsRex) savingsRex = 0;

    this.state = {
      confirming: false,
      sellAmountValid: true,
      decimalSellAmount: 0,
      SAVINGSrex: savingsRex,
      REXbalance: rexBalance,
      COREbalance: coreBalance,
      formError: null,
      submitDisabled: true
    };
  }

  componentWillMount() {
    const {
      confirming,
      sellAmount
    } = this.props;

    this.setState({
      confirming,
      decimalSellAmount: sellAmount || Decimal(0)
    });
  }

  onSubmit = (e) => {
    if (!this.state.submitDisabled) {
      this.setState({
        confirming: true
      });
    }
    e.preventDefault();
    return false;
  }

  onKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.onSubmit(e);

      e.preventDefault();
      return false;
    }
  }

  onError = (error) => {
    let errorMessage;

    if (error !== true) {
      errorMessage = error;
    }

    this.setState({
      submitDisabled: true,
      formError: errorMessage
    });
  }

  onChange = (e, { name, value, valid }) => {
    const newState = {
      [name]: value,
      formError: null,
      submitDisabled: false
    };

    const decimalFieldName = `decimal${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    newState[decimalFieldName] = Decimal(value.split(' ')[0]);

    newState[`${name}Valid`] = valid;

    this.setState(newState, () => {
      const error = this.errorsInForm();
      if (error) {
        this.onError(error);
      }
    });
  }

  errorsInForm = () => {
    const {
      SAVINGSrex,
      sellAmountValid,
      decimalSellAmount
    } = this.state;
    const {
      rex,
      settings
    } = this.props;

    if (!sellAmountValid) {
      return 'invalid_amount';
    }

    const totalRex = rex.rexpool.total_rex.split(' ')[0];
    const totalLendable = rex.rexpool.total_lendable.split(' ')[0];
    const rexBalance = Decimal(decimalSellAmount / 
      (parseFloat(totalLendable) / parseFloat(totalRex))).toFixed(settings.tokenPrecision);

    if (Decimal.max(0, rexBalance).greaterThan(SAVINGSrex)) {
      return 'not_enough_balance';
    }

    return false;
  }

  onBack = () => {
    this.setState({
      confirming: false
    });
  }

  onConfirm = () => {
    const {
      actions,
      rex,
      settings
    } = this.props;

    const {
      decimalSellAmount
    } = this.state;

    const {
      mvfromsavings
    } = actions;

    this.setState({
      confirming: false
    });

    const totalRex = rex.rexpool.total_rex.split(' ')[0];
    const totalLendable = rex.rexpool.total_lendable.split(' ')[0];
    const rexBalance = Decimal(decimalSellAmount / 
      (parseFloat(totalLendable) / parseFloat(totalRex))).toFixed(settings.tokenPrecision);

    mvfromsavings(rexBalance);
  }

  render() {
    const {
      balance,
      onClose,
      rex,
      system,
      settings,
      t
    } = this.props;

    const {
      decimalSellAmount,
      COREbalance,
      REXbalance,
      SAVINGSrex,
      submitDisabled
    } = this.state;

    const shouldShowConfirm = this.state.confirming;
    const shouldShowForm = !shouldShowConfirm;

    let {
      formError
    } = this.state;
    
    const totalRex = rex.rexpool.total_rex.split(' ')[0];
    const totalLendable = rex.rexpool.total_lendable.split(' ')[0];
    const rexBalance = totalRex > 0 ? decimalSellAmount / (parseFloat(totalLendable) / parseFloat(totalRex)) : 0;
    const savingBalance = (parseFloat(totalLendable) / parseFloat(totalRex) * SAVINGSrex);

    return (
      <Segment
        loading={system.REX_MVFROMSAVINGS === 'PENDING'}
      >
        {(shouldShowForm)
          ? (
            <div>
              <WalletPanelFormExchangeSavingsStats
                COREbalance={COREbalance}
                REXbalance={REXbalance}
                rex={rex}
                settings={settings}
              />
              <Form
                onKeyPress={this.onKeyPress}
                onSubmit={this.onSubmit}
              >
                <Form.Group widths="equal">
                  <GlobalFormFieldToken
                    autoFocus
                    icon="microchip"
                    label={t('rex_savings_amount_to_move', {tokenSymbol:settings.blockchain.tokenSymbol, action:'move from'})}
                    name="sellAmount"
                    onChange={this.onChange}
                    defaultValue={decimalSellAmount.toFixed(settings.tokenPrecision)}
                    settings={settings}
                  />
                </Form.Group>
                <Header size="tiny">
                    {(rexBalance).toFixed(settings.tokenPrecision)} REX
                    <Header.Subheader>
                    {t('rex_sellrex_amount_ratio', {tokenSymbol:'REX'})}
                    </Header.Subheader>
                </Header>
                <FormMessageError
                  error={formError}
                />
                <Divider />
                <Message
                  icon="info circle"
                  info
                  content={t('rex_savings_movefrom_explanation', {tokenSymbol:settings.blockchain.tokenSymbol})}
                />
                <Divider />
                <Button
                  content={t('cancel')}
                  color="grey"
                  onClick={onClose}
                />
                <Button
                  content={t('rex_savings_movefrom_button', {tokenSymbol:settings.blockchain.tokenSymbol})}
                  color="green"
                  disabled={submitDisabled}
                  floated="right"
                  primary
                />
              </Form>
            </div>
          ) : ''}

        {(shouldShowConfirm)
          ? (
            <WalletPanelFormExchangeMoveFromConfirming
              balance={balance}
              decimalSellAmount={decimalSellAmount}
              COREbalance={COREbalance}
              REXbalance={REXbalance}
              savingBalance={savingBalance}
              onBack={this.onBack}
              onConfirm={this.onConfirm}
              rex={rex}
              settings={settings}
            />
          ) : ''}
      </Segment>
    );
  }
}

export default translate('exchange')(WalletPanelFormExchangeMoveFrom);
