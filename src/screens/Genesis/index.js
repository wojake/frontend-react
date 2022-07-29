import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import { numberWithSpaces } from '../../utils';

import './styles.scss';

export default function Genesis() {
  const { t } = useTranslation();
  const [data, setData] = useState({});

  useEffect(() => {
    async function fetchData() {
      /*
        {
          "result": "success",
          "count": 136,
          "inception": 1357010470,
          "ledger_index": 32570,
          "genesis_balance_all": 99999999999.99632,
          "balance_all": 504471064.5181259,
          "balance_update": 1550646472,
          "genesis": [
            {
              "address": "rBKPS4oLSaV2KVVuHH8EpQqMGgGefGFQs7",
              "genesis_balance": 370,
              "genesis_index": 1,
              "rippletrade": "DeaDTerra",
              "nickname": "DeaDTerra"
              "balance": 20.009958
            },
      */
      const response = await axios('v2/genesis');
      setData(response.data);
    }
    fetchData();
  }, [setData]);

  const timestampFormatParams = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
  const lastUpdate = (timestamp, params) => {
    return timestamp ? new Date(timestamp * 1000).toLocaleDateString([], params) : '';
  }

  return (
    <div className="page-genesis content-text">
      <h1 className="center">{t("menu.genesis")}</h1>

      <div className='flex'>
        <div className="grey-box">
          The ledger <b>32570</b> is the earliest ledger available, approximately the first week of XRPL history,
          {" "}
          <a
            href="https://web.archive.org/web/20171211225452/https://forum.ripple.com/viewtopic.php?f=2&t=3613"
            rel="noreferrer"
            target="_blank"
          >
            ledgers 1 through 32569 were lost due to a mishap in 2012
          </a>.
          <br /><br />
          Because the XRP Ledger's state is recorded in every ledger version, the ledger can continue without the missing history.
        </div>

        <div className="grey-box">
          <table>
            <tbody>
              <tr><td>Ledger index</td><td>32570</td></tr>
              <tr><td>Account count</td><td>136</td></tr>
              <tr>
                <td>Inception</td>
                <td>{new Date("2013-01-01T03:21:00Z").toLocaleString([], timestampFormatParams)}</td>
              </tr>
              <tr><td>XRP balance</td><td>99 999 999 999.996320</td></tr>
              <tr><td colSpan={2}><hr /></td></tr>
              <tr>
                <td>Balance update</td>
                <td>{lastUpdate(data.balance_update, timestampFormatParams)}</td>
              </tr>
              <tr>
                <td>XRP balance</td>
                <td>{data.balance_all && numberWithSpaces(data.balance_all)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <br />
      <table className="table-large">
        <thead>
          <tr>
            <th>Genesis index</th>
            <th>Address</th>
            <th>Genesis XRP balance</th>
            <th>XRP balance {lastUpdate(data.balance_update, {})}</th>
            <th>Rippletrade</th>
            <th>Nickname</th>
          </tr>
        </thead>
        <tbody>
          {data?.genesis?.map((account, i) => (
            <tr key={i}>
              <td>{account.genesis_index}</td>
              <td><a href={"https://bithomp.com/explorer/" + account.address}>{account.address}</a></td>
              <td>{numberWithSpaces(account.genesis_balance)}</td>
              <td>{numberWithSpaces(account.balance)}</td>
              <td><a href={"https://bithomp.com/explorer/" + account.rippletrade}>{account.rippletrade}</a></td>
              <td>{account.nickname}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
