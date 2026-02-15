import React, { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

interface ConsumerSignupScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  isSocialLogin?: boolean; // 소셜 로그인 모드 여부
}

const POLICY_TEXT = {
  age: `필수 확인 만 14세 이상 이용 확인
본 서비스는 만 14세 이상만 이용할 수 있습니다. 회원가입 또는 서비스 이용 과정에서 이용자는 본인이 만 14세 이상임을 확인하고 이에 동의합니다.
만 14세 미만이 허위로 가입한 것이 확인될 경우 회사는 계정 이용을 제한하거나 탈퇴 처리할 수 있습니다.`,
  terms: `오늘득템 서비스 이용약관
시행일: 2026-02-07
운영주체: 비비(BB)컴퍼니 / 사업자등록번호: 350-33-01601 / 주소: 경기도 성남시 분당구 정자동 7, 두산위브파빌리온 / 문의: bb_career@naver.com

제1조(목적)
본 약관은 비비(BB)컴퍼니(이하 “회사”)가 운영하는 오늘득템 플랫폼(이하 “서비스”)의 이용과 관련하여 회사와 이용자(고객 및 파트너) 간 권리·의무 및 책임사항, 이용조건과 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조(정의)
1. “서비스”란 회사가 운영하는 모바일 애플리케이션/웹을 통해 제공하는 상품정보 노출, 예약(픽업) 중개, 알림, 내역관리 등 일체의 기능을 말합니다.
2. “고객”이란 서비스에서 상품을 확인하고 예약한 후 파트너 매장에서 결제 및 픽업하는 이용자를 말합니다.
3. “파트너”란 서비스에 매장 및 상품(재고/땡기 상품 포함)을 등록·노출하고 고객에게 현장판매(결제 수령 포함) 및 픽업을 제공하는 사업자를 말합니다.
4. “예약”이란 고객이 서비스에서 특정 상품의 픽업을 위해 수량·시간 등을 선택하고, 서비스가 이를 파트너에게 전달하여 픽업 의사를 확인하는 절차를 말합니다.
5. “이용료/크레딧”이란 파트너가 서비스 이용권(노출, 예약 중개, 관리 기능 등)에 대한 대가로 회사에 지급하는 금액 또는 선납 크레딧을 말합니다(제10조).

제3조(서비스의 성격 및 거래당사자)
1. 회사는 파트너가 제공하는 상품의 정보를 노출하고 예약을 중개하는 정보통신서비스 제공자(플랫폼 운영자)이며, 고객과 파트너 간 매매계약의 당사자가 아닙니다.
2. 상품의 제조·보관·품질·표시(원산지/알레르겐/유통기한 등)·재고관리·판매 및 현장결제의 수령과 영수증/세금계산서 발급 등은 파트너의 책임과 권한으로 합니다.
3. 고객-파트너 간 분쟁이 발생하는 경우 회사는 거래당사자가 아닌 범위에서 합리적으로 협조할 수 있으나, 법령 또는 본 약관에서 별도로 정한 경우를 제외하고 상품 자체에 대한 책임을 부담하지 않습니다.

제4조(약관의 효력 및 변경)
1. 본 약관은 서비스 화면에 게시하거나 기타 방법으로 공지하고, 고객 또는 파트너가 이에 동의함으로써 효력이 발생합니다.
2. 회사는 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 적용일자 및 개정 사유를 명시하여 서비스 내 공지사항 등으로 사전 고지합니다.
3. 이용자가 변경약관에 동의하지 않는 경우 이용계약을 해지(탈퇴)할 수 있으며, 고지한 효력발생일 이후에도 서비스를 계속 이용하는 경우 변경약관에 동의한 것으로 봅니다.

제5조(이용계약의 체결 및 계정 관리)
1. 고객의 이용계약은 회원가입 또는 비회원 이용(가능한 범위에서) 절차에 따라 성립합니다. 회사는 운영정책에 따라 일부 기능을 회원에게만 제공할 수 있습니다.
2. 만 14세 미만은 회원가입 및 서비스 이용이 제한됩니다(법정대리인 동의 절차를 제공하지 않는 방식으로 운영하는 경우).
3. 이용자는 계정정보를 최신·정확하게 유지하여야 하며, 제3자에게 계정을 양도·대여하거나 공유할 수 없습니다.

제6조(서비스 제공 및 중단)
1. 서비스는 원칙적으로 연중무휴 24시간 제공하되, 시스템 점검, 장애, 통신사고, 천재지변, 기타 불가피한 사유가 있는 경우 전부 또는 일부가 제한·중단될 수 있습니다.
2. 회사는 서비스 개선 또는 정책 변경에 따라 서비스 내용의 전부 또는 일부를 변경할 수 있으며, 중요 변경은 사전에 고지합니다.

제7조(예약, 품절, 취소 및 노쇼)
1. 예약의 성립, 확정, 취소 가능 시간, 노쇼 처리 기준(패널티 등)은 서비스 내 ‘운영정책’에서 정하며, 정책은 약관의 일부로 봅니다.
2. 파트너는 예약 확정 이후 고객이 지정한 픽업시간 내 제공이 가능하도록 재고를 확보하고, 품절 또는 제공 불가가 예상되는 경우 지체 없이 고객에게 통지하고 예약을 취소·조정하여야 합니다.
3. 고객은 예약 후 정해진 시간 내 방문하여 픽업·결제를 완료해야 하며, 사전 통지 없이 반복적으로 노쇼하는 경우 회사는 서비스 이용을 제한할 수 있습니다.

제8조(결제, 영수증 및 환불)
1. 고객의 결제는 원칙적으로 파트너 매장에서 파트너에게 직접 이루어집니다. 회사는 고객 결제를 수령하거나, 결제대금을 보관·정산·환불하는 역할을 수행하지 않습니다.
2. 상품의 하자, 누락, 변심(가능한 범위), 위생·표시 문제 등으로 인한 환불·교환·손해배상은 원칙적으로 파트너가 관계 법령 및 자체 정책에 따라 처리합니다.
3. 회사는 분쟁 조정, 연락 전달 등 합리적 범위에서 협조할 수 있으며, 파트너의 위법·부당행위가 의심되는 경우 노출 제한, 이용정지, 계약해지 등 조치를 취할 수 있습니다.

제9조(파트너의 의무 및 제재)
1. 파트너는 (i) 상품정보(가격, 수량, 픽업 가능 시간, 구성, 유통기한/소비기한, 보관방법, 원산지 및 알레르겐 등 법정표시사항)를 정확히 기재하고 최신 상태로 유지해야 합니다.
2. 파트너는 식품위생, 표시·광고, 전자상거래 소비자보호, 개인정보보호 등 관련 법령을 준수해야 하며, 위반으로 발생하는 모든 책임(민·형사 및 행정상 책임)은 파트너에게 있습니다.
3. 파트너는 고객의 연락처 등 개인정보를 예약 처리 및 고객응대 목적 범위에서만 이용하고, 목적 달성 후 지체 없이 파기하며, 제3자 제공·광고활용을 금지합니다.
4. 허위재고 등록, 반복적 품절·미제공, 부정리뷰, 고객 기만, 불법 상품 판매 등이 확인되는 경우 회사는 노출 제한, 이용정지, 계약해지, 손해배상 청구 등 조치를 취할 수 있습니다.

제10조(파트너 이용료, 구독 플랜 및 크레딧)
1. 이용료의 성격: 회사는 파트너에게 상품 노출, 예약 중개, 관리 기능 등 ‘플랫폼 이용권’ 제공의 대가로 구독 플랜에 따른 이용료를 부과합니다. 이용료는 파트너의 실제 판매금액, 매출, 현장결제 결과와 직접 연동되지 않습니다.
2. 결제 방식: 이용료는 월 단위 등 회사가 정한 주기에 따라 선불로 결제되며, 플랜별 가격/기능/이용 한도는 서비스 화면 또는 별도 정책으로 공지합니다.
3. 크레딧(선납): 파트너는 선택적으로 크레딧을 선납할 수 있으며, 크레딧은 서비스 내에서 회사가 고지한 기준(예: 상품 등록 1건, 예약 1건, 특정 노출 옵션 등)에 따라 차감됩니다.
4. 잔액 부족 시 조치: 크레딧 잔액이 부족한 경우 회사는 합리적 범위에서 (i) 상품 노출 제한, (ii) 신규 등록 제한, (iii) 예약 중개 기능 제한 등을 할 수 있습니다.
5. 환불 원칙 및 예외: 크레딧은 서비스 이용대가의 선납 성격으로 원칙적으로 현금 환불되지 않습니다. 다만 (i) 회사의 시스템 오류·중복 과금 등 회사 귀책, (ii) 법령상 환불 의무가 있는 경우, (iii) 회사가 별도 프로모션/정책으로 환불을 허용한 경우에는 그 범위에서 환불할 수 있습니다.
6. 세금 처리: 회사는 관련 법령에 따라 이용료 등에 대한 증빙(현금영수증/세금계산서 등)을 발급할 수 있습니다(파트너의 사업자 정보 제공이 필요한 경우).

제11조(게시물 및 지식재산권)
1. 이용자가 서비스에 게시하는 리뷰, 댓글, 이미지 등(이하 “게시물”)의 저작권은 원칙적으로 게시자에게 귀속됩니다.
2. 이용자는 회사에게 서비스 운영·홍보(서비스 내 노출, 통계/분석, 분쟁 대응 등)에 필요한 범위에서 게시물을 무상으로 이용(복제, 전송, 전시, 배포, 2차적 저작물 작성 포함)할 수 있는 비독점적 권리를 부여합니다(법령이 허용하는 범위).
3. 명예훼손, 비방, 개인정보 노출, 불법광고, 저작권 침해 등 위법하거나 운영정책에 위반되는 게시물은 사전 통지 없이 삭제·차단될 수 있습니다.

제12조(이용제한, 해지, 손해배상)
1. 회사는 이용자의 약관 위반, 불법·부정 이용, 보안 위협, 반복적 고객 피해 유발 등이 확인되는 경우 서비스 이용을 제한하거나 이용계약을 해지할 수 있습니다(긴급한 경우 사후 통지 가능).
2. 이용자는 언제든지 서비스 내 절차에 따라 이용계약을 해지(탈퇴)할 수 있습니다.
3. 이용자의 귀책으로 회사에 손해가 발생한 경우 회사는 손해배상을 청구할 수 있습니다.

제13조(면책)
1. 회사는 파트너와 고객 간 거래의 당사자가 아니므로, 상품의 안전성/적법성/품질/재고/위생 및 파트너의 법령 위반에 대해 책임을 부담하지 않습니다. 다만, 회사의 고의 또는 중대한 과실로 이용자에게 손해가 발생한 경우에는 관련 법령에 따릅니다.
2. 회사는 천재지변, 통신장애, 제3자 서비스 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.

제14조(준거법 및 관할)
본 약관은 대한민국 법률을 준거법으로 하며, 서비스 이용과 관련하여 분쟁이 발생한 경우 민사소송법에 따른 관할 법원에 제기합니다.

제15조(회사 정보)
상호: 비비(BB)컴퍼니
대표자: 김민지
사업자등록번호: 350-33-01601
주소: 경기도 성남시 분당구 정자동 7, 두산위브파빌리온
문의: bb_career@naver.com`,
  privacy: `오늘득템 개인정보처리방침
시행일: 2026-02-07 | 개정일: 2026-02-07
운영주체: 비비(BB)컴퍼니 / 개인정보 보호책임자: 김민지 / 문의: bb_career@naver.com
주소: 경기도 성남시 분당구 정자동 7, 두산위브파빌리온 / 사업자등록번호: 350-33-01601
1. 개인정보의 처리 목적
회사는 다음 목적을 위해 필요한 최소한의 개인정보를 처리합니다.
1) 고객/파트너 회원가입 및 본인 확인(필요한 경우)
2) 상품·매장 정보 제공, 예약(픽업) 중개, 알림 제공, 고객지원
3) 파트너 입점 심사 및 계약/구독/크레딧 관리, 세무·회계 처리
4) 부정이용 방지, 서비스 안정성 확보, 보안 로그 분석
5) 분쟁 대응 및 법령상 의무 이행
2. 처리하는 개인정보 항목
회사는 서비스 유형에 따라 아래 정보를 수집·이용합니다(서비스 화면에 고지된 범위).
가. 고객(필수) : 휴대전화번호(예약 확인/픽업 안내 및 매장 전달), 닉네임, 예약/이용 내역, 고객문의 내용
나. 고객(자동수집) : 기기 정보(모델/OS), 접속기록(로그), 서비스 이용기록, 접속 IP, 쿠키/광고식별자(선택 동의 또는 설정에 따라)
다. 파트너(필수) : 상호, 사업자등록번호, 대표자명, 담당자명, 연락처, 이메일, 정산/세무에 필요한 정보(해당 시)
라. 매장정보 : 주소, 영업시간, 업종/카테고리, 픽업 안내, 매장 사진(선택)
마. 위치정보(선택) : ‘내 주변 매장/상품 찾기’ 기능 이용 시, 검색 시점에 한해 단말기의 위치를 활용할 수 있습니다. 회사는 실시간 추적을 하지 않으며, 개인위치정보의 처리 및 확인자료 보관 등은 ‘위치기반서비스 이용약관’에 따릅니다.
3. 개인정보의 처리 및 보유 기간
회사는 원칙적으로 개인정보 처리 목적 달성 시 지체 없이 파기합니다. 다만, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 보관합니다.
1) 계약 또는 청약철회 등에 관한 기록: 5년(전자상거래 등에서의 소비자보호에 관한 법률)
2) 대금결제 및 재화 등의 공급에 관한 기록: 5년(전자상거래법) — 단, 회사가 결제를 수령하지 않더라도 예약/거래 관련 분쟁 대응 목적의 기록은 관련 법령 범위 내에서 보관할 수 있습니다.
3) 소비자의 불만 또는 분쟁처리에 관한 기록: 3년(전자상거래법)
4) 표시·광고에 관한 기록: 6개월(전자상거래법)
5) 접속기록(IP 등): 3개월(통신비밀보호법)
6) 파트너 계약/입점 관련 서류: 계약 종료 후 1년(분쟁 대응 목적)
7) 위치정보 이용·제공사실 확인자료: 6개월 이상(위치정보법)
4. 개인정보의 제3자 제공
회사는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
1) 고객의 예약 이행을 위해 파트너에게 제공: 휴대전화번호, 예약 내역(상품/수량/픽업시간 등)
2) 법령에 근거한 요청이 있는 경우 또는 수사기관의 적법한 절차에 따른 요청이 있는 경우
※ 제공받는 자(파트너)는 목적 범위 내에서만 이용하고, 목적 달성 후 지체 없이 파기하여야 합니다.
5. 개인정보 처리위탁 및 국외이전
회사는 서비스 제공을 위해 개인정보 처리업무를 위탁하거나 국외이전을 할 수 있으며, 이 경우 관련 법령에 따라 위탁계약 체결 및 공개/고지합니다.
예) Google LLC(구글폼/워크스페이스): 입점 신청서 수집·저장·관리
예) Supabase 등 클라우드/DB: 서비스 운영 데이터 저장 및 인증(사용 시)
예) 분석도구(PostHog 등): 서비스 이용 통계 및 품질 개선(사용 시, 최소 데이터·익명화 우선)
※ 실제 수탁자/이전국가/보유기간/이전방법 등은 서비스 내 ‘수탁자 현황’에 최신으로 공개합니다.
6. 정보주체의 권리 및 행사방법
정보주체는 개인정보 열람, 정정, 삭제, 처리정지, 동의철회 등을 요구할 수 있습니다.
접수: bb_career@naver.com (본인 확인 후 지체 없이 조치)
7. 개인정보의 파기절차 및 방법
보유기간 경과 또는 처리목적 달성 시 지체 없이 파기합니다.
전자적 파일: 복구 불가능한 방법으로 삭제
종이 문서: 분쇄 또는 소각
8. 개인정보의 안전성 확보조치
회사는 개인정보보호법 등 관련 법령에 따라 다음 조치를 시행합니다.
1) 접근권한 최소화 및 계정관리(권한 분리, MFA 적용 등)
2) 개인정보 전송·저장 암호화(가능한 범위)
3) 접속기록 보관 및 위변조 방지
4) 취약점 점검 및 보안 업데이트
5) 개인정보 처리자 교육 및 내부관리계획 수립
9. 개인정보 보호책임자
개인정보 보호책임자: 김민지
문의: bb_career@naver.com
10. 고지의무
본 개인정보처리방침은 2026-02-07부터 적용됩니다. 내용 추가·삭제·수정이 있을 경우 서비스 내 공지사항 등을 통해 사전 공지합니다.`,
  location: `오늘득템 위치기반서비스 이용약관
시행일: 2026-02-07
제1조(목적)
본 약관은 비비(BB)컴퍼니(이하 “회사”)이 제공하는 위치기반서비스와 관련하여 회사와 개인위치정보주체 및 이용자 간 권리·의무 및 기타 필요한 사항을 규정함을 목적으로 합니다.
제2조(서비스 내용)
회사는 이용자의 위치를 기반으로 주변 매장/상품을 검색·표시하는 기능 등 위치기반 서비스를 제공합니다.
회사는 실시간 위치 추적을 목적으로 하지 않으며, 이용자의 단말기 설정/권한에 따라 검색 시점의 위치정보를 활용합니다.
제3조(개인위치정보의 수집·이용)
회사는 위치기반서비스 제공을 위해 이용자의 사전 동의를 받아 개인위치정보를 수집·이용할 수 있습니다.
회사는 위치정보를 서비스 제공 목적 범위에서만 이용하며, 제3자 제공은 이용자의 별도 동의가 있는 경우에 한합니다.
제4조(위치정보 이용·제공사실 확인자료의 보유)
회사는 위치정보의 보호 및 이용 등에 관한 법률 제16조 제2항에 따라 개인위치정보주체에 대한 위치정보 수집·이용·제공사실 확인자료를 위치정보시스템에 자동으로 기록하고, 6개월 이상 보관합니다.
제5조(개인위치정보의 보유 및 이용기간)
회사는 개인위치정보를 서비스 제공에 필요한 기간 동안만 보유·이용하며, 목적 달성 시 지체 없이 파기합니다. 다만, 법령상 보존의무가 있는 확인자료는 제4조에 따릅니다.
제6조(개인위치정보주체의 권리)
개인위치정보주체는 언제든지 개인위치정보 수집·이용·제공에 대한 동의의 전부 또는 일부를 철회할 수 있습니다.
개인위치정보주체는 개인위치정보 이용·제공사실 확인자료의 열람·고지를 요구할 수 있습니다.
제7조(법정대리인의 권리)
회사는 만 14세 미만 아동의 개인위치정보를 수집·이용 또는 제공하고자 하는 경우 법정대리인의 동의를 받습니다(단, 회사가 만 14세 미만 이용을 제한하는 방식으로 운영하는 경우 해당되지 않습니다).
제8조(손해배상 및 면책)
회사가 법령을 위반하여 개인위치정보주체에게 손해가 발생한 경우 관련 법령에 따라 배상합니다.
단, 회사의 고의 또는 과실이 없는 경우에는 책임이 제한될 수 있습니다.
제9조(분쟁의 조정)
위치정보와 관련한 분쟁은 위치정보법에 따라 방송통신위원회 또는 개인정보보호위원회에 분쟁조정을 신청할 수 있습니다.
부칙
본 약관은 2026-02-07부터 시행합니다.`,
  marketing: `마케팅 정보 수신 동의(선택)
수집 항목: 휴대전화번호, 이메일(선택 제공 시)
이용 목적: 이벤트/혜택/프로모션 등 광고성 정보 발송(SMS, 앱 푸시, 이메일 등)
보유 및 이용기간: 동의 철회 시까지
동의 거부 시 불이익: 동의하지 않아도 서비스 이용에는 제한이 없습니다.`,
  ads: `맞춤형 광고 목적 개인정보 수집·이용 동의(선택)
수집 항목: 광고식별자(ADID/IDFA), 기기정보(OS/모델), 서비스 이용기록(검색/클릭/예약 등), 접속일시
이용 목적: 관심사 기반 맞춤형 광고 제공, 광고 성과 분석, 노출 빈도 조절
보유 및 이용기간: 동의 철회 시까지 또는 관련 법령/정책에 따른 기간
동의 거부 시 불이익: 동의하지 않아도 서비스 이용에는 제한이 없습니다(다만 맞춤형 혜택/광고 제공이 제한될 수 있습니다).`,
};

const CONSENT_ITEMS = [
  {
    id: 'age',
    required: true,
    title: '만 14세 이상입니다.',
    detail: '만 14세 미만은 가입 및 이용이 제한됩니다.',
    fullText: POLICY_TEXT.age,
  },
  {
    id: 'terms',
    required: true,
    title: '서비스 이용약관에 동의합니다.',
    detail: '서비스 이용 조건, 회사/이용자/파트너의 권리의무, 책임 범위를 확인하였습니다.',
    fullText: POLICY_TEXT.terms,
  },
  {
    id: 'privacy',
    required: true,
    title: '개인정보 처리방침에 동의합니다.',
    detail: '예약/픽업을 위해 필요한 개인정보 수집이용, 보관기간, 제3자 제공(파트너 제공) 내용을 확인하였습니다.',
    fullText: POLICY_TEXT.privacy,
  },
  {
    id: 'location',
    required: false,
    title: '위치기반서비스 이용약관에 동의합니다.',
    detail:
      '내 주변 매장/상품 추천 등 위치기반 기능 이용 약관이며, 미동의 시 기본 서비스 이용은 가능하나 위치기반 기능이 제한될 수 있습니다.',
    fullText: POLICY_TEXT.location,
  },
  {
    id: 'marketing',
    required: false,
    title: '마케팅 정보 수신에 동의합니다.',
    detail: '이벤트/혜택/공지 등 마케팅 정보를 이메일/문자/푸시로 수신할 수 있으며, 언제든지 철회할 수 있습니다.',
    fullText: POLICY_TEXT.marketing,
  },
  {
    id: 'ads',
    required: false,
    title: '맞춤형 광고 목적의 개인정보 수집이용에 동의합니다.',
    detail: '이용행태 정보를 기반으로 맞춤형 콘텐츠/광고가 제공될 수 있으며, 언제든지 철회할 수 있습니다.',
    fullText: POLICY_TEXT.ads,
  },
];

export default function ConsumerSignupScreen({ onBack, onSuccess, isSocialLogin = false }: ConsumerSignupScreenProps) {
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [consents, setConsents] = useState<Record<string, boolean>>(
    Object.fromEntries(CONSENT_ITEMS.map((item) => [item.id, false]))
  );
  const [modalContent, setModalContent] = useState<{ title: string; text: string } | null>(null);
  const requiredIds = useMemo(() => CONSENT_ITEMS.filter((item) => item.required).map((item) => item.id), []);
  const isRequiredChecked = requiredIds.every((id) => consents[id]);
  const isAllChecked = CONSENT_ITEMS.every((item) => consents[item.id]);
  const requiredLabel = '[필수]';
  const optionalLabel = '[선택]';

  const handleSignup = async () => {
    if (!isRequiredChecked) {
      Alert.alert('필수 약관 동의', '필수 항목에 동의해주세요.');
      return;
    }
    // 소셜 로그인 모드: 전화번호만 필수
    if (isSocialLogin) {
      if (!phone) {
        Alert.alert('오류', '전화번호를 입력해주세요.');
        return;
      }

      setLoading(true);

      try {
        // 현재 로그인된 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('로그인 정보를 찾을 수 없습니다.');
        }

        // consumers 테이블에 추가 정보 저장
        const { error: consumerError } = await supabase
          .from('consumers')
          .insert([
            {
              user_id: user.id,
              nickname: nickname.trim() || user.email?.split('@')[0] || '사용자',
              phone: phone.trim(),
              total_savings: 0,
            },
          ]);

        if (consumerError) throw consumerError;

        Alert.alert(
          '가입 완료',
          '일반고객으로 등록되었습니다!',
          [{ text: '확인', onPress: onSuccess }]
        );
      } catch (error: any) {
        console.error('프로필 설정 오류:', error);
        Alert.alert('오류', '프로필 설정 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 일반 회원가입 모드: 모든 항목 필수
      if (!nickname || !phone || !email || !password || !confirmPassword) {
        Alert.alert('오류', '모든 항목을 입력해주세요.');
        return;
      }

    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      // 1. Supabase Auth에 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('회원가입에 실패했습니다.');
      }

      // 2. consumers 테이블에 추가 정보 저장
      const { error: consumerError } = await supabase
        .from('consumers')
        .insert([
          {
            user_id: authData.user.id,
            nickname: nickname.trim(),
            phone: phone.trim(),
            total_savings: 0,
          },
        ]);

      if (consumerError) throw consumerError;

      Alert.alert(
        '회원가입 완료',
        '일반고객으로 가입되었습니다!\n로그인해주세요.',
        [{ text: '확인', onPress: onSuccess }]
      );
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      Alert.alert('회원가입 실패', '회원가입에 실패했습니다. 이미 가입된 이메일인지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isSocialLogin ? '추가 정보 입력' : '일반고객 회원가입'}
        </Text>
        <Text style={styles.subtitle}>
          {isSocialLogin 
            ? '서비스 이용을 위해 추가 정보를 입력해주세요.' 
            : '할인 상품을 예약하고 절약하세요!'}
        </Text>

        <View style={styles.form}>
          {/* 닉네임 - 소셜 로그인 시 선택사항 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              이름 (닉네임) {isSocialLogin ? '(선택)' : ''}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={isSocialLogin ? '미입력 시 이메일 아이디 사용' : '홍길동'}
              value={nickname}
              onChangeText={setNickname}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>전화번호 *</Text>
            <TextInput
              style={styles.input}
              placeholder="010-1234-5678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          {/* 이메일/비밀번호 - 일반 회원가입 시에만 표시 */}
          {!isSocialLogin && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>이메일</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>비밀번호</Text>
                <TextInput
                  style={styles.input}
                  placeholder="최소 6자 이상"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>비밀번호 확인</Text>
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </>
          )}

          <View style={styles.consentSection}>
            <Text style={styles.sectionTitle}>약관 동의</Text>
            <TouchableOpacity
              style={styles.allConsentRow}
              onPress={() =>
                setConsents((prev) =>
                  Object.fromEntries(CONSENT_ITEMS.map((item) => [item.id, !isAllChecked]))
                )
              }
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, isAllChecked && styles.checkboxChecked]}>
                {isAllChecked && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <Text style={styles.allConsentText}>전체 동의</Text>
            </TouchableOpacity>
            <Text style={styles.consentHelperText}>전체 동의에는 선택 항목도 포함됩니다.</Text>
            <View style={styles.consentList}>
              {CONSENT_ITEMS.map((item) => (
                <View key={item.id} style={styles.consentItem}>
                  <TouchableOpacity
                    style={styles.consentRow}
                    onPress={() => setConsents((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, consents[item.id] && styles.checkboxChecked]}>
                      {consents[item.id] && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                    <View style={styles.consentTextBlock}>
                      <Text style={styles.consentTitle}>
                        {item.required ? requiredLabel : optionalLabel} {item.title}
                      </Text>
                      <Text style={styles.consentDetail}>{item.detail}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setModalContent({ title: item.title, text: item.fullText })}
                    disabled={loading}
                  >
                    <Text style={styles.consentLink}>전문보기</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.disabledButton]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.signupButtonText}>
              {loading ? '처리 중...' : (isSocialLogin ? '완료' : '회원가입')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={loading}>
            <Text style={styles.backButtonText}>뒤로 가기</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={!!modalContent}
        animationType="slide"
        transparent
        onRequestClose={() => setModalContent(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalContent?.title}</Text>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator>
              <Text style={styles.modalText}>{modalContent?.text}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalContent(null)}>
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  signupButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  consentSection: {
    marginTop: 10,
  },
  consentList: {
    gap: 12,
  },
  allConsentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  allConsentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  consentHelperText: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
  },
  consentItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#FAFAFA',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C7C7C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    borderColor: '#00A84D',
    backgroundColor: '#00D563',
  },
  checkboxMark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  consentTextBlock: {
    flex: 1,
  },
  consentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  consentDetail: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  consentLink: {
    marginTop: 8,
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  modalBody: {
    marginBottom: 16,
  },
  modalText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  modalCloseText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
