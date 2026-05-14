module.exports = async () => {
  // pg pool은 각 test file에서 pool.end()를 afterAll로 호출하므로 별도 처리 없음
};
