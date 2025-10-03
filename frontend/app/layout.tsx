import "./globals.css";

export const metadata = {
  title: "TreasureFHE",
  description: "Encrypted lootbox dApp using Zama FHEVM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


