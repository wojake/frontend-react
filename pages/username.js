import { useState, useEffect } from 'react'
import { useTranslation, Trans } from 'next-i18next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { getIsSsrMobile } from "../utils/mobile"

import {
  isAddressValid,
  isUsernameValid,
  server,
  wssServer,
  devNet,
  addAndRemoveQueryParams,
  addQueryParams,
  encode
} from '../utils'

export const getServerSideProps = async (context) => {
  const { query, locale } = context
  const { address, username, receipt } = query
  return {
    props: {
      isSsrMobile: getIsSsrMobile(context),
      addressQuery: address || "",
      usernameQuery: username || "",
      receiptQuery: receipt || "false",
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

import CountrySelect from '../components/UI/CountrySelect'
import CheckBox from '../components/UI/CheckBox'
import Receipt from '../components/Receipt'
import SEO from '../components/SEO'

const checkmark = "/images/checkmark.svg";

let interval;
let ws = null;

export default function Username({ setSignRequest, account, signOut, addressQuery, usernameQuery, receiptQuery }) {
  const { t, i18n } = useTranslation()
  const router = useRouter()

  const [address, setAddress] = useState("");
  const [username, setUsername] = useState("");
  const [receipt, setReceipt] = useState(false);
  const [agreeToPageTerms, setAgreeToPageTerms] = useState(false);
  const [agreeToSiteTerms, setAgreeToSiteTerms] = useState(false);
  const [agreeToPrivacyPolicy, setAgreeToPrivacyPolicy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentErrorMessage, setPaymentErrorMessage] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [register, setRegister] = useState({});
  const [bidData, setBidData] = useState({});
  const [step, setStep] = useState(0);
  const [onRegistartion, setOnRegistartion] = useState(false);
  const [update, setUpdate] = useState(false);
  const [xummUserToken, setXummUserToken] = useState(null)

  let addressRef
  let usernameRef

  useEffect(() => {
    setXummUserToken(localStorage.getItem('xummUserToken'))
    let queryAddList = [];
    let queryRemoveList = [];
    if (!account) {
      if (isAddressValid(addressQuery)) {
        setAddress(addressQuery);
      } else {
        queryRemoveList.push("address");
      }
    }
    if (isUsernameValid(usernameQuery)) {
      setUsername(usernameQuery);
    } else {
      queryRemoveList.push("username");
    }
    if (receiptQuery === "true") {
      setReceipt(true);
    } else {
      queryRemoveList.push("receipt");
    }
    addAndRemoveQueryParams(router, queryAddList, queryRemoveList)

    //on component unmount
    return () => {
      setUpdate(false);
      clearInterval(interval);
      if (ws) ws.close();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (account?.address) {
      setAddress(account.address);
      addQueryParams(router, [
        {
          name: "address",
          value: account.address
        }
      ])
    }
    setXummUserToken(localStorage.getItem('xummUserToken'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  useEffect(() => {
    if (step > 0) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    setErrorMessage("");
  }, [i18n.language]);

  useEffect(() => {
    // show receipt
    if (receipt && username && address && countryCode) {
      onSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt, username, address, countryCode]);

  const onAddressChange = (e) => {
    let address = e.target.value;
    address = address.replace(/[^0-9a-zA-Z.]/g, "");
    setAddress(address);
    let queryAddList = [];
    let queryRemoveList = [];
    if (isAddressValid(address)) {
      queryAddList.push({
        name: "address",
        value: address
      })
      setErrorMessage("");
    } else {
      queryRemoveList.push("address");
    }
    addAndRemoveQueryParams(router, queryAddList, queryRemoveList)
  }

  const onUsernameChange = (e) => {
    let username = e.target.value;
    username = username.replace(/[^0-9a-zA-Z.]/g, "");
    setUsername(username);
    let queryAddList = [];
    let queryRemoveList = [];
    if (isUsernameValid(username)) {
      queryAddList.push({
        name: "username",
        value: username
      })
      setErrorMessage("");
    } else {
      queryRemoveList.push("username");
    }
    addAndRemoveQueryParams(router, queryAddList, queryRemoveList)
  }

  const onCancel = () => {
    setUpdate(false)
    clearInterval(interval)
    setStep(0)
    setOnRegistartion(false)
    if (ws) ws.close()
  }

  const oneMore = () => {
    onCancel()
    signOut()
    setAddress("")
    setUsername("")
    setAgreeToPageTerms(false)
    setAgreeToPrivacyPolicy(false)
    setAgreeToSiteTerms(false)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    })
  }

  const onSubmit = async () => {
    if (!address) {
      setErrorMessage(t("username.error.address-empty"));
      addressRef?.focus();
      return;
    }

    if (!isAddressValid(address)) {
      setErrorMessage(t("username.error.address-invalid"));
      addressRef?.focus();
      return;
    }

    if (!username) {
      setErrorMessage(t("username.error.username-empty"));
      usernameRef?.focus();
      return;
    }

    if (!isUsernameValid(username)) {
      setErrorMessage(t("username.error.username-invalid"));
      usernameRef?.focus();
      return;
    }

    if (!receipt) {
      if (!agreeToPageTerms) {
        setErrorMessage(t("username.error.agree-terms-page"));
        return;
      }

      if (!agreeToSiteTerms) {
        setErrorMessage(t("username.error.agree-terms-site"));
        return;
      }

      if (!agreeToPrivacyPolicy) {
        setErrorMessage(t("username.error.agree-privacy-policy"));
        return;
      }
    }

    const postData = {
      bithompid: username,
      address,
      countryCode,
    };
    const apiData = await axios.post('v1/bithompid', postData).catch(error => {
      setErrorMessage(t("error." + error.message))
    })

    const data = apiData?.data

    if (data?.invoiceId) {
      let serviceName = 'XRPL'
      if (data.userInfo) {
        if (data.userInfo.name) {
          serviceName = data.userInfo.name
        } else {
          serviceName = data.userInfo.domain
        }
      }
      setErrorMessage(t("username.error.address-hosted", { service: serviceName }))
      return
    }

    if (data?.error) {
      let addressInput = addressRef;
      let usernameInput = usernameRef;
      if (data.error === 'Username is already registered') {
        setErrorMessage(t("username.error.username-taken", { username }));
        usernameInput?.focus();
        return;
      }
      if (data.error === 'Username can not be registered') {
        setErrorMessage(t("username.error.username-reserved", { username }));
        usernameInput?.focus();
        return;
      }
      if (data.error === 'Bithompid is on registration') {
        setErrorMessage(t("username.error.username-hold", { username }));
        return;
      }
      if (data.error === "Address is invalid") {
        setErrorMessage(t("username.error.address-invalid"));
        addressInput?.focus();
        return;
      }
      if (data.error === 'Sorry, you already have a registered username on that address. Try another address') {
        setErrorMessage(t("username.error.address-done"));
        addressInput?.focus();
        return;
      }
      setErrorMessage(data.error);
      return;
    }

    if (data?.bithompid) {
      setRegister(data);
      setErrorMessage("");
      // if partly paid, completed or receipt
      checkPayment(data.bithompid, data.sourceAddress, data.destinationTag)

      if (data.completedAt) {
        setStep(2)
        setOnRegistartion(false)
      } else {
        if (xummUserToken && data.destinationAddress) {
          setOnRegistartion(true)
          setSignRequest({
            wallet: "xumm",
            request: {
              TransactionType: "Payment",
              Destination: data.destinationAddress,
              DestinationTag: data.destinationTag,
              Amount: String(data.amount * 1000000),
              Memos: [
                {
                  "Memo": {
                    "MemoData": encode(t("username.memo") + ": " + data.bithompid)
                  }
                }
              ]
            }
          })
        } else {
          setStep(1)
        }
        //no ws when completed / receipt, no api status check every minute
        setUpdate(true);
      }
    }
  }

  useEffect(() => {
    if (agreeToPageTerms || agreeToSiteTerms || agreeToPrivacyPolicy) {
      setErrorMessage("");
    }
  }, [agreeToPageTerms, agreeToSiteTerms, agreeToPrivacyPolicy]);

  useEffect(() => {
    if (register.destinationTag && update) {
      interval = setInterval(() => checkPayment(register.bithompid, register.sourceAddress, register.destinationTag), 60000);
      checkPaymentWs(register.bithompid, register.sourceAddress, register.destinationTag);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update, register]);

  const updateBid = (data) => {
    setBidData(data.bid);
    /* 
      setBidData({
        "bid": {
          "id": 933,
          "createdAt": 1658837571,
          "updatedAt": 1658840261,
          "bithompid": "testtest1",
          "address": "rpqVJrX7L4yx2vjYPpDC5DAGrdp92zcsMW",
          "destinationTag": 480657625,
          "action": "Registration",
          "status": "Partly paid",
          "price": 29.46,
          "totalReceivedAmount": 29.1,
          "currency": "XRP",
          "priceInSEK": 100,
          "country": "SE",
          "totalToPay": 29.46,
          "totalPayLeft": 0.35999999999999943
        },
        "transactions": [
          {
            "id": 365,
            "processedAt": 1658837750,
            "hash": "65FC5B4F3227D385CFFEEC7DC14493A59AB78FD112096877EB94CB4C24C12CD9",
            "ledger": 29798617,
            "type": "Payment",
            "sourceAddress": "rpqVJrX7L4yx2vjYPpDC5DAGrdp92zcsMW",
            "destinationAddress": "rsuUjfWxrACCAwGQDsNeZUhpzXf1n1NK5Z",
            "destinationTag": 480657625,
            "amount": 29,
            "status": "Completed"
          }
        ]
      });
    */
    if (data.bid.status === 'Completed') {
      setStep(2);
      setOnRegistartion(false)
      setUpdate(false);
      setErrorMessage("");
      clearInterval(interval);
      if (ws) ws.close();
      return;
    }
    if (data.bid.status === "Partly paid") {
      setPaymentErrorMessage(t("username.error.payment-partly", { received: data.bid.totalReceivedAmount, required: data.bid.price, currency: data.bid.currency }));
      return;
    }
    if (data.bid.status === "Timeout") {
      setStep(0);
      setUpdate(false);
      clearInterval(interval);
      if (ws) ws.close();
      return;
    }
    if (data.error) {
      setErrorMessage(data.error);
    }
  }

  const checkPayment = async (username, address, destinationTag) => {
    const response = await axios('v1/bithompid/' + username + '/status?address=' + address + '&dt=' + destinationTag).catch(error => {
      setErrorMessage(t("error." + error.message))
    });
    const data = response.data;
    if (data) {
      updateBid(data);
    }
  }

  const checkPaymentWs = (bithompid, address, destinationTag) => {
    if (!update) return;
    ws = new WebSocket(wssServer);

    ws.onopen = () => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ command: "subscribe", bids: [{ bithompid, address, destinationTag }], "id": 1 }));
      }
    }

    ws.onmessage = evt => {
      const message = JSON.parse(evt.data);
      if (message) {
        updateBid(message);
      }
    }

    ws.onclose = () => {
      if (update) {
        checkPaymentWs(bithompid, address, destinationTag);
      }
    }
  }

  return <>
    <SEO
      title={t("menu.usernames") + (usernameQuery ? (" " + usernameQuery) : "") + (addressQuery ? (" " + addressQuery) : "")}
    />
    <div className="page-username content-center">
      <h1 className="center">{t("menu.usernames")}</h1>
      {!step &&
        <>
          <p>
            <Trans i18nKey="username.step0.text0">
              Bithomp <b>username</b> is a <b>public</b> username for your XRPL address.
            </Trans>
          </p>
          {!devNet &&
            <>
              <p className="brake">
                <Trans i18nKey="username.step0.text1">
                  The username will be assosiated with your address on the bithomp explorer and in third-party services which use bithomp <a href="https://docs.bithomp.com">API</a>.
                  After the registration it will become public - <b>anyone</b> will be able to see it.
                  Your XRPL address will be accessable by:
                </Trans>
                {" " + server}/explorer/{isUsernameValid(username) ? username : <i>username</i>}
              </p>
              <p>
                <Trans i18nKey="username.step0.text2">
                  The username <b>can not be changed or deleted</b>.
                </Trans>
              </p>
              <p>{t("username.step0.only-one-for-address")}</p>
              <p>{t("username.step0.address-you-control")}</p>
              <p>{t("username.step0.pay-from-your-address")}</p>
              <p>
                <Trans i18nKey="username.step0.text3">
                  The payment is for 100 Swedish kronor denominated in XRP. The payment for the username is <b>not refundable</b>. If you pay more than requested, the exceeding amount will be counted as donation and won't be refunded.
                </Trans>
              </p>
            </>
          }
          {(!account?.username || onRegistartion) ?
            <>
              {account?.username && onRegistartion ?
                <div className='center'><span className="waiting"></span><br />{t("general.loading")}</div>
                :
                <>
                  {devNet ?
                    <p>
                      <Trans i18nKey="username.step0.text4">
                        Usernames are now used cross-chain, <a href="https://bithomp.com/username" target="_blank" rel='noreferrer'>Register a username for an address on the XRPL mainnet</a> and it will be also available on bithomp dev explorers.
                      </Trans>
                    </p>
                    :
                    <>
                      {account?.address ?
                        <>
                          <p>{t("username.step0.your-address")} (<b className='link' onClick={signOut}>{t("username.step0.sign-out")}</b>):</p>
                          <div className="input-validation">
                            <input placeholder={t("username.step0.your-address")} value={address} className="input-text" spellCheck="false" readOnly />
                            <img src={checkmark} className="validation-icon" alt="validated" />
                          </div>
                        </>
                        :
                        <>
                          <p>{t("username.step0.enter-address-or")} <b className="link" onClick={() => setSignRequest({ wallet: "xumm" })}>{t("username.step0.sign-in")}</b>:</p>
                          <div className="input-validation">
                            <input placeholder={t("username.step0.your-address")} value={address} onChange={onAddressChange} className="input-text" ref={node => { addressRef = node; }} spellCheck="false" maxLength="36" />
                            {isAddressValid(address) && <img src={checkmark} className="validation-icon" alt="validated" />}
                          </div>
                        </>
                      }
                      <p>{t("username.step0.enter-username")}:</p>
                      <div className="input-validation">
                        <input placeholder={t("username.step0.your-username")} value={username} onChange={onUsernameChange} className="input-text" ref={node => { usernameRef = node; }} spellCheck="false" maxLength="18" />
                        {isUsernameValid(username) && <img src={checkmark} className="validation-icon" alt="validated" />}
                      </div>
                      <p>{t("username.step0.enter-country")}:</p>
                      <CountrySelect setCountryCode={setCountryCode} />

                      <CheckBox checked={agreeToPageTerms} setChecked={setAgreeToPageTerms} >
                        {t("username.step0.agree-terms-page")}
                      </CheckBox>

                      <CheckBox checked={agreeToSiteTerms} setChecked={setAgreeToSiteTerms} >
                        <Trans i18nKey="username.step0.agree-terms-site">
                          I agree with the <Link href="/terms-and-conditions" target="_blank">Terms and conditions</Link>.
                        </Trans>
                      </CheckBox>

                      <CheckBox checked={agreeToPrivacyPolicy} setChecked={setAgreeToPrivacyPolicy} >
                        <Trans i18nKey="username.step0.agree-privacy-policy">
                          I agree with the <Link href="/privacy-policy" target="_blank">Privacy policy</Link>.
                        </Trans>
                      </CheckBox>

                      <p className="center">
                        <input type="button" value={t("button.continue")} className="button-action" onClick={onSubmit} />
                      </p>
                    </>
                  }
                </>
              }
            </>
            :
            <p className='bordered' style={{ padding: "20px" }}>
              {t("username.step0.already-registered")}: <b>{account.username}</b>.
              <br />
              <Trans i18nKey="username.step0.sign-out-to-register-another-one">
                <b className='link' onClick={signOut}>Sign out</b> from this account to register a username for a different address.
              </Trans>
            </p>
          }
        </>
      }
      {step === 1 &&
        <>
          <p>{t("username.step1.to-register")} <b>{register.bithompid}</b></p>
          <p>
            {t("username.step1.from-your-address")} <b>{register.sourceAddress}</b>.
            <br />
            <Trans i18nKey="username.step1.text0">
              Payments made by you <b className="red">from any other addresses</b> or with a <b className="red">wrong destination tag</b> won't be accepted for the service, it will be accepted as a donation and <b className="red">won't be refunded</b>.
            </Trans>
          </p>

          <h3>{t("username.step1.payment-instructions")}</h3>
          <div className='payment-instructions bordered'>
            {t("username.step1.address")}<br /><b>{register.destinationAddress}</b>
            <br /><br />
            {t("username.step1.tag")}<br /><b className="red">{register.destinationTag}</b>
            <br /><br />
            {t("username.step1.amount")}<br /><b>{register.amount} {register.currency}</b>
          </div>

          <h3>{t("username.step1.awaiting")}</h3>
          <div className='payment-awaiting bordered center'>
            <div className="waiting"></div>
            <br /><br />
            <p className="red center" dangerouslySetInnerHTML={{ __html: paymentErrorMessage || "&nbsp;" }} />
            {t("username.step1.about-confirmation")}
          </div>
        </>
      }
      {step === 2 &&
        <>
          <p className="center">
            <Trans i18nKey="username.step2.text0" values={{ username: register.bithompid }}>
              Congratulations! Your username <b className="blue">{{ username }}</b> has been succesfully registered.
            </Trans>
          </p>
          <p className="center bold">
            <a href={server + '/explorer/' + register.bithompid}>
              <u>{server}/explorer/{register.bithompid}</u>
            </a>
          </p>
          <Receipt item="username" details={bidData} />
          <br />
          <div className='center'>
            <span className="link" onClick={oneMore}>{t("username.step2.one-more")}</span>
          </div>
        </>
      }
      <p className="red center" dangerouslySetInnerHTML={{ __html: errorMessage || "&nbsp;" }} />
      {step === 1 &&
        <p className="center">
          <input type="button" value={t("button.cancel")} className="button-action" onClick={onCancel} />
        </p>
      }
    </div>
  </>
};
