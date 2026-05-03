const TYPE_MAP = {
  BUSINESS_LICENSE: '营业执照',
  QUALIFICATION_CERT: '资格证',
  QUALIFICATION: '资质证书',
  BANK_ACCOUNT_PERMIT: '银行开户许可',
  TAX_CERTIFICATE: '税务登记证',
  LICENSE: '许可证',
  OTHER: '其他'
}

export function certTypeLabel(value) {
  return TYPE_MAP[value] || value || '-'
}
