
function category(start, end) {

    let startTime = new Date(start);
    let endTime = new Date(end);
    let s = String(startTime.getFullYear()) + String(startTime.getMonth() + 1);
    let e = String(endTime.getFullYear()) + String(endTime.getMonth() + 1);

    let y = startTime.getFullYear();
    let m = startTime.getMonth() + 1;

    let t = [];
    t[0] = String(startTime.getFullYear()) + '/' + String(startTime.getMonth() + 1);;
    if (s == e) {
        let result = {};
        t.forEach(el => {
            result[el] = [];
        })
        return result;
    } else {
        let last;
        do {
            m = m + 1;
            if (m == 13) {
                m = m - 12;
                y = y + 1;
            }
            let time = String(y) + String(m);
            time = Number(time);
            last = time;
            t.push(String(y) + '/' + String(m))
        } while (last != e)

        let result = {};
        t.forEach(el => {
            result[el] = {
                data: []
            };

        })
        return result;
    }
}

let items = [1,2,3,4,5,6];
let set = [];

for (let i =0;i<4;i++){
    let item = items[Math.floor(Math.random() * items.length)] ;
    set.push(item) 
}

console.log(set)