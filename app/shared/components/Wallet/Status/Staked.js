// @flow
import React, { Component } from 'react';
import { translate } from 'react-i18next';

import { Segment, Table } from 'semantic-ui-react';

const prettyBytes = require('bytes');

class WalletStatusStaked extends Component<Props> {
  render() {
    const {
      account,
      statsFetcher,
      settings,
      t
    } = this.props;

    const {
      cpu_limit,
      net_limit,
      ram_quota,
      ram_usage
    } = account;
    const no_delegation = {
      cpu_weight: '0.'.padEnd(settings.tokenPrecision + 2, '0') + ' ' + settings.blockchain.tokenSymbol,
      net_weight: '0.'.padEnd(settings.tokenPrecision + 2, '0') + ' ' + settings.blockchain.tokenSymbol
    };
    const self_delegated_bandwidth = account.self_delegated_bandwidth ? 
      account.self_delegated_bandwidth : no_delegation;
    const total_resources = account.total_resources ? 
      account.total_resources : no_delegation;
    const {
      cpuWeight,
      netWeight
    } = statsFetcher.delegatedStats();

    return (
      <Segment vertical basic>
        <Table
          attached="bottom"
          definition
          unstackable
        >
          <Table.Body>
            <Table.Row>
              <Table.Cell>{t('wallet_status_resources_cpu_available_title')}</Table.Cell>
              <Table.Cell>
                <Table compact>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell collapsing>
                        {t('wallet_status_resources_total')}
                      </Table.Cell>
                      <Table.Cell>
                        {total_resources.cpu_weight}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell collapsing>
                        {t('wallet_status_resources_staked')}
                      </Table.Cell>
                      <Table.Cell>
                        {self_delegated_bandwidth.cpu_weight}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        {t('wallet_status_resources_delegated')}
                      </Table.Cell>
                      <Table.Cell>
                        {cpuWeight}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        {t('wallet_status_resources_usage')}
                      </Table.Cell>
                      <Table.Cell>
                        {(cpu_limit.used / 1000000).toFixed(settings.tokenPrecision)} sec / {(cpu_limit.max / 1000000).toFixed(settings.tokenPrecision)} sec
                      </Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>{t('wallet_status_resources_net_available_title')}</Table.Cell>
              <Table.Cell>
                <Table compact>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell collapsing>
                        {t('wallet_status_resources_total')}
                      </Table.Cell>
                      <Table.Cell>
                        {total_resources.net_weight}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell collapsing>
                        {t('wallet_status_resources_staked')}
                      </Table.Cell>
                      <Table.Cell>
                        {self_delegated_bandwidth.net_weight}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        {t('wallet_status_resources_delegated')}
                      </Table.Cell>
                      <Table.Cell>
                        {netWeight}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        {t('wallet_status_resources_usage')}
                      </Table.Cell>
                      <Table.Cell>
                        {prettyBytes(parseInt(net_limit.used))} / {prettyBytes(parseInt(net_limit.max))}
                      </Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>{t('wallet_status_resources_ram_available_title')}</Table.Cell>
              <Table.Cell>
              <Table compact>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell collapsing>
                        {t('wallet_status_resources_usage')}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      </Table.Cell>
                      <Table.Cell>
                        {prettyBytes(parseInt(ram_usage))} / {prettyBytes(parseInt(ram_quota))}
                      </Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Segment>
    );
  }
}

export default translate('wallet')(WalletStatusStaked);
