package com.traitor.ambatushop_10.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter @Setter
public class TransaksiRequest {
    private String metodePembayaran; // "TUNAI" atau "NON_TUNAI"
    private Double total;
    private Long akunId;
    private String kasirName;
    private List<TransaksiDetailRequest> details;
}
