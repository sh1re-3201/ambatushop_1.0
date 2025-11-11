package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.service.KeuanganService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/keuangan")
@AllArgsConstructor
public class KeuanganController {

    private final KeuanganService keuanganService;


}
