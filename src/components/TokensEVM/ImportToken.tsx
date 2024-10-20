import { Button, Modal, Flex, Space, Input } from 'antd';
import { useState, useEffect } from 'react';
import { blockchains } from '@storage/blockchains';
import localForage from 'localforage';
import { cryptos } from '../../types';
import { useTranslation } from 'react-i18next';
import TokenBoxImport from './TokenBoxImport';
import { setActivatedTokens } from '../../store';
import { getTokenMetadata } from '../../lib/transactions';
const logos :any = import.meta.glob("../../assets/*.svg", {import: 'default', eager: true});

function ImportToken(props: {
  open: boolean;
  openAction: (status: boolean) => void;
  chain: keyof cryptos;
  wInUse: string;
  contracts: string[]; // contracts that are already imported
}) {
  const { t } = useTranslation(['home', 'common']);
  const { open, openAction } = props;
  const blockchainConfig = blockchains[props.chain];

  const [selectedContracts, setSelectedContracts] = useState(props.contracts);
  const [search, setSearch] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  const handleOk = () => {
    openAction(false);
    // save to redux
    setActivatedTokens(props.chain, props.wInUse, selectedContracts || []);
    // save to storage
    void (async function () {
      await localForage.setItem(
        `activated-tokens-${props.chain}-${props.wInUse}`,
        selectedContracts,
      );
    })();
  };

  const handleCustomImport = async () => {
    openAction(false);

    let arr : string[] = [];
    arr = selectedContracts.slice();
    const data: any = await getTokenMetadata(contractAddress, props.chain);
    arr.concat(contractAddress);

    let logo :any = logos['../../assets/etht.svg'];
    if (props.chain == 'sepolia') {
      logo = logos['../../assets/teth.svg'];
    } 

    if (!data) {
      return;
    }

    if (data.logo != '') {
      logo = data.logo;
    }

    const token = {
      contract: contractAddress,
      name: data.name,
      symbol: data.symbol,
      decimals: data.decimals,
      logo: logo,
    };

    // check if the newly added token is duplicate
    const count : number = blockchains[props.chain].tokens.filter((item) => token.name == item.name).length;

    if (count <= 0) {
      blockchains[props.chain].tokens.push(token);
      setActivatedTokens(props.chain, props.wInUse, arr || []);
    }

    void (async function () {
      await localForage.setItem(
        `activated-tokens-${props.chain}-${props.wInUse}`,
        arr,
      );
    })();

    // Adding custom token to local storage for keeping
    let customTokens : any = [];
    let customTokensFromStorage :any = await localForage.getItem(
      `custom-token-${props.chain}`
    );
  
    if (customTokensFromStorage != null && customTokensFromStorage.length > 0) {
      customTokens = customTokensFromStorage.slice();
    }

    const num : number = customTokens.filter((item: any) => token.name == item.name).length;
    
    if (num <= 0) {
      customTokens.push(token);
    }
    
    void (async function () {
      await localForage.setItem(
        `custom-token-${props.chain}`,
        customTokens,
      );
    })();
  };

  const handleCancel = () => {
    openAction(false);
    setSelectedContracts(props.contracts);
  };

  useEffect(() => {
    console.log(selectedContracts);
  }, [selectedContracts]);

  useEffect(() => {
    console.log("Search")
  }, [search]);

  const contractChanged = (contract: string, value: boolean) => {
    if (value) {
      setSelectedContracts([...selectedContracts, contract]);
    } else {
      setSelectedContracts(
        selectedContracts.filter((item) => item !== contract),
      );
    }
  };

  const filterTokens = () => {
    return blockchainConfig.tokens.filter((item) => {
      if (search == '') {
        return true;
      } else {
        return item.symbol.toLowerCase().includes(search.toLowerCase()) 
          || item.name.toLowerCase().includes(search.toLowerCase())
      }
    });
  }

  const handleSearchToken = (e: any) => {
    setSearch(e.target.value);
  };

  const handleContractAddress = (e: any) => {
    setContractAddress(e.target.value);
  };

  return (
    <>
      <Modal
        title={t('home:tokens.import_token')}
        open={open}
        onOk={handleOk}
        style={{ textAlign: 'center', top: 60 }}
        onCancel={handleCancel}
        footer={[]}
      >
        <Input
          id='searchToken'
          variant='outlined'
          placeholder='Search Token'
          allowClear
          onChange={handleSearchToken}
          size='large'
        />
        <Flex
          wrap
          gap="middle"
          style={{ marginTop: '20px', marginBottom: '20px' }}
        >
          {
            filterTokens().map((item) => (
              <TokenBoxImport
                chain={props.chain}
                tokenInfo={item}
                key={item.contract + item.symbol}
                active={
                  selectedContracts.includes(item.contract) || !item.contract
                }
                notSelectable={
                  props.contracts.includes(item.contract) || !item.contract
                }
                selectAction={contractChanged}
              />
            ))
          }
        </Flex>
        {
          filterTokens().length <= 0 ?
          <>
            <br /><br />
            <Input
              id='contractAddress'
              variant='outlined'
              placeholder='Enter Token Contract Address'
              allowClear
              onChange={handleContractAddress}
              size='large'
            />
          </>
          : ''
        }
        <Space direction="vertical" size="large">
          <div></div>
          {
            filterTokens().length <= 0 ? 
            <Button type="primary" size="large" onClick={handleCustomImport}>
              {t('home:tokens.add_to_list')}
            </Button>
            :
            <Button type="primary" size="large" onClick={handleOk}>
              {t('home:tokens.import_selected')}
            </Button> 
            
          }
          <Button type="link" block size="small" onClick={handleCancel}>
            {t('common:cancel')}
          </Button>
        </Space>
      </Modal>
    </>
  );
}

export default ImportToken;
