// @flow
import React, { Component } from 'react';
import { translate } from 'react-i18next';
import { Container, Form, Message, Header } from 'semantic-ui-react';
import debounce from 'lodash/debounce';

import GlobalFormFieldGeneric from '../../../../Global/Form/Field/Generic';
import GlobalFormFieldAccount from '../../../../Global/Form/Field/Account';
import GlobalFormFieldKeyPublic from '../../../../Global/Form/Field/Key/Public';
import FormMessageError from '../../../../Global/Form/Message/Error';

class WalletPanelFormAccountRequest extends Component<Props> {
  onSubmit = () => this.props.onSubmit()
  render() {
    const {
      error,
      isValid,
      onChange,
      setPrivateKey,
      settings,
      shouldShowAccountNameWarning,
      t,
      values
    } = this.props;
    return (
      <Form
        warning={shouldShowAccountNameWarning}
        onSubmit={this.onSubmit}
      >
        <Header>
          {t('wallet_account_request_form_header')}
          <Header.Subheader>
            {t('wallet_account_request_form_subheader')}
          </Header.Subheader>
        </Header>
        <GlobalFormFieldAccount
          autofocus
          label={t('wallet_account_request_form_create_account_account_name')}
          name="accountName"
          onChange={debounce(onChange, 300)}
          value={values.accountName}
        />
        <GlobalFormFieldKeyPublic
          defaultValue={values.owner}
          generate
          label={t('wallet_account_request_form_create_account_owner_key')}
          name="owner"
          onChange={onChange}
          setPrivateKey={setPrivateKey}
          settings={settings}
        />
        <GlobalFormFieldKeyPublic
          defaultValue={values.active}
          generate
          label={t('wallet_account_request_form_create_account_active_key')}
          name="active"
          onChange={onChange}
          setPrivateKey={setPrivateKey}
          settings={settings}
        />
        <GlobalFormFieldGeneric
          label={t('wallet_account_request_form_create_account_referred_by')}
          name="referredby"
          onChange={debounce(onChange, 600)}
          settings={settings}
          value={values.referredby}
        />
        <FormMessageError
          error={error}
          icon="warning sign"
          style={{ margin: '1em 0' }}
        />
        {(shouldShowAccountNameWarning)
          ? (
            <Message
              content={t('wallet_account_request_form_create_account_account_name_warning')}
              icon="info circle"
              warning
            />
          ) : ''}
        <Container textAlign="right">
          <Form.Button
            color="blue"
            content={t('next')}
            disabled={!isValid}
          />
        </Container>
      </Form>
    );
  }
}

export default translate('wallet')(WalletPanelFormAccountRequest);
