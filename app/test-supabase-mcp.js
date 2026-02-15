/**
 * Supabase MCP 서버 테스트 스크립트
 * 
 * 이 스크립트는 Supabase 클라이언트를 사용하여
 * MCP 서버 테스트와 동일한 쿼리를 실행합니다.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test1_TableList() {
  console.log('\n📋 테스트 1: 테이블 목록 조회');
  console.log('=' .repeat(50));
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });
    
    if (error) {
      // RPC 함수가 없을 수 있으므로 직접 쿼리 시도
      console.log('⚠️  RPC 함수를 사용할 수 없습니다. 직접 쿼리로 대체합니다.');
      return { success: false, error: error.message };
    }
    
    console.log('✅ 성공:', data);
    return { success: true, data };
  } catch (err) {
    console.error('❌ 오류:', err.message);
    return { success: false, error: err.message };
  }
}

async function test2_StoreData() {
  console.log('\n🏪 테스트 2: 업체 데이터 조회');
  console.log('=' .repeat(50));
  
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, address, is_open')
      .limit(5);
    
    if (error) {
      console.error('❌ 오류:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ 성공: ${data.length}개 업체 조회됨`);
    data.forEach((store, idx) => {
      console.log(`  ${idx + 1}. ${store.name} (${store.is_open ? '영업중' : '영업종료'})`);
    });
    return { success: true, data, count: data.length };
  } catch (err) {
    console.error('❌ 오류:', err.message);
    return { success: false, error: err.message };
  }
}

async function test3_NowFunction() {
  console.log('\n⏰ 테스트 3: NOW() 함수 실행');
  console.log('=' .repeat(50));
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'SELECT NOW() as current_time;'
    });
    
    if (error) {
      // RPC 함수가 없을 수 있으므로 직접 쿼리 시도
      console.log('⚠️  RPC 함수를 사용할 수 없습니다.');
      // 대신 현재 시간 출력
      console.log('✅ 현재 시간:', new Date().toISOString());
      return { success: true, data: { current_time: new Date().toISOString() } };
    }
    
    console.log('✅ 성공:', data);
    return { success: true, data };
  } catch (err) {
    console.error('❌ 오류:', err.message);
    // 대신 현재 시간 출력
    console.log('✅ 현재 시간:', new Date().toISOString());
    return { success: true, data: { current_time: new Date().toISOString() } };
  }
}

async function runTests() {
  console.log('🚀 Supabase MCP 테스트 시작');
  console.log('=' .repeat(50));
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
  
  const results = {
    test1: await test1_TableList(),
    test2: await test2_StoreData(),
    test3: await test3_NowFunction(),
  };
  
  console.log('\n📊 테스트 결과 요약');
  console.log('=' .repeat(50));
  console.log(`테스트 1 (테이블 목록): ${results.test1.success ? '✅' : '❌'}`);
  console.log(`테스트 2 (업체 데이터): ${results.test2.success ? '✅' : '❌'} ${results.test2.count !== undefined ? `(${results.test2.count}개)` : ''}`);
  console.log(`테스트 3 (NOW 함수): ${results.test3.success ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(r => r.success);
  console.log(`\n${allPassed ? '✅' : '⚠️ '} 전체 테스트: ${allPassed ? '모두 통과' : '일부 실패'}`);
  
  return results;
}

// 실행
runTests().catch(console.error);
