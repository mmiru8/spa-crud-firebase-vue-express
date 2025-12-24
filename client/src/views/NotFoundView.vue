<template>
  <div class="page">
    <h1>404</h1>
    <p class="muted">Pagina nu există.</p>
    <RouterLink class="link" to="/">Înapoi la Home</RouterLink>
  </div>
</template>

<style scoped>
.page{max-width:900px;margin:40px auto;padding:0 16px;font-family:system-ui;}
.muted{color:#666;}
.link{display:inline-block;margin-top:10px;color:#111;text-decoration:none;font-weight:600;}
.link:hover{text-decoration:underline;}
</style>
