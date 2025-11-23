package com.traitor.ambatushop_10.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TransaksiDetailRequest {
    private Long produkId;
    private short jumlah;
    private double hargaSatuan;
    private double subtotal;
}