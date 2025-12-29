import {
  connect,
  disconnect,
  getLocalStorage,
  isConnected,
  request,
} from "@stacks/connect";
import { useCallback, useEffect, useState } from "react";
import config from "@/lib/config/client";
import { useAuthSession } from "@/providers/auth-session-provider";

async function _connectWallet(connected: boolean) {
  if (!connected) {
    const response = await connect({ network: config.stacksNetwork });
    const account = response.addresses.find(
      (address) => address.symbol === "STX",
    );
    if (!account) {
      throw new Error("Could not find STX address");
    }
    return [account.address, account.publicKey];
  } else {
    const userData = getLocalStorage();
    if (!userData?.addresses) {
      throw new Error("No wallet addresses found");
    }
    const stxAddress = userData.addresses.stx[0].address;
    const accounts = await request("getAddresses");
    const account = accounts.addresses.find(
      (address) => address.address === stxAddress,
    );
    if (!account) {
      throw new Error("Could not find wallet address");
    }
    if (!account.publicKey) {
      throw new Error("Could not retrieve public key from wallet");
    }
    return [account.address, account.publicKey];
  }
}

export function useWallet() {
  const { session, clearSession, setSession } = useAuthSession();
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<{
    address: string;
    publicKey?: string;
  } | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: not needed
  const connectWallet = useCallback(async () => {
    const [address, publicKey] = await _connectWallet(connected);
    setData({ address, publicKey });
    setConnected(true);
    setSession({ user: { walletAddress: address } });
    return [address, publicKey];
  }, [connected]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: not needed
  useEffect(() => {
    const checkConnection = () => {
      const connected = isConnected();
      console.log("Connected:", connected);

      if (connected) {
        const userData = getLocalStorage();
        const stxAddress = userData?.addresses?.stx?.[0]?.address;
        if (!stxAddress) {
          console.log("No STX address found");
          disconnect();
          setConnected(false);
          setData(null);
          if (session) {
            console.log("Logging out");
            clearSession();
          }
          return;
        }
        if (session && session.user.walletAddress !== stxAddress) {
          console.log("STX address mismatch");
          disconnect();
          setConnected(false);
          setData(null);
          console.log("Logging out");
          clearSession();
          return;
        }
        setConnected(true);
        setSession({ user: { walletAddress: stxAddress } });
        setData({ address: stxAddress });
      } else {
        if (session) {
          console.log("Wallet disconnected");
          setConnected(false);
          setData(null);
          clearSession();
        }
        setConnected(false);
      }
    };

    checkConnection();
    const handleStorageChange = () => {
      checkConnection();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [setSession, clearSession]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setConnected(false);
    setData(null);
    if (session) {
      clearSession();
    }
  }, [session, clearSession]);

  return {
    data,
    isConnected: connected,
    connect: connectWallet,
    disconnect: disconnectWallet,
  };
}
