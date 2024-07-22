import { formatCurrencyAmount, formatNumber, NumberType } from '@uniswap/conedison/format'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { useCallback, useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { ThemedText } from 'theme'

import { TextButton } from '../Button'

function formatPrice(price: string, type: NumberType = NumberType.FiatTokenPrice): string {
  if (price === null || price === undefined) {
    return '-'
  }

  return formatNumber(parseFloat(price), type)
}

export function useTradeExchangeRate(
  trade: InterfaceTrade,
  outputUSDC?: CurrencyAmount<Currency>,
  base: 'input' | 'output' = 'input'
): [string, string | undefined] {
  const { inputAmount, outputAmount, executionPrice } = trade

  // Compute the usdc price from the output price, so that it aligns with the displayed price.
  const { price, usdcPrice } = useMemo(() => {
    switch (base) {
      case 'input':
        return {
          price: executionPrice,
          usdcPrice: outputUSDC?.multiply(inputAmount.decimalScale).divide(inputAmount),
        }
      case 'output':
        return {
          price: executionPrice.invert(),
          usdcPrice: outputUSDC?.multiply(outputAmount.decimalScale).divide(outputAmount),
        }
    }
  }, [base, executionPrice, inputAmount, outputAmount, outputUSDC])

  return useMemo(
    () => [
      `${1} ${price.baseCurrency.symbol} = ${formatPrice(price.toSignificant(), NumberType.TokenTx)} 
      ${price.quoteCurrency.symbol}`,
      usdcPrice && formatCurrencyAmount(usdcPrice, NumberType.FiatTokenPrice),
    ],
    [price, usdcPrice]
  )
}

interface PriceProps {
  trade: InterfaceTrade
  outputUSDC?: CurrencyAmount<Currency>
}

/** Displays the price of a trade. If outputUSDC is included, also displays the unit price. */
export default function Price({ trade, outputUSDC }: PriceProps) {
  const [defaultBase, setDefaultBase] = useState(false)
  const onClick = useCallback(() => setDefaultBase(!defaultBase), [defaultBase])

  const [exchangeRate, usdcPrice] = useTradeExchangeRate(trade, outputUSDC, defaultBase ? 'input' : 'output')

  return (
    <TextButton
      color="primary"
      onClick={(e) => {
        onClick()
        e.stopPropagation()
      }}
    >
      <ThemedText.Body2>
        <Row gap={0.25}>
          {exchangeRate}
          {usdcPrice && <ThemedText.Body2 color="secondary">({usdcPrice})</ThemedText.Body2>}
        </Row>
      </ThemedText.Body2>
    </TextButton>
  )
}
